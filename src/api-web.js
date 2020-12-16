const { Api, Transport, ID, PathInfo, ColorStyle } = require('acebase-core');
const connectSocket = require('socket.io-client');

const { AceBaseRequestError, NOT_CONNECTED_ERROR_MESSAGE } = require('./request/error');
const _request = require('./request');
const _websocketRequest = (socket, event, data, accessToken) => {

    const requestId = ID.generate();
    const request = data;
    request.req_id = requestId;
    request.access_token = accessToken;

    socket.emit(event, request);

    let resolve, reject;
    let promise = new Promise((res, rej) => { resolve = res; reject = rej; });

    const timeout = setTimeout(() => { 
        socket.off("result", handle);
        const err = new AceBaseRequestError(request, null, 'timeout', `Server did not respond "${event}" request in a timely fashion`);
        reject(err);
    }, 10000);
    const handle = response => {
        if (response.req_id === requestId) {
            clearTimeout(timeout);
            socket.off("result", handle);
            if (response.success) {
                resolve(response);
            }
            else {
                // Access denied?
                const code = typeof response.reason === 'object' ? response.reason.code : response.reason;
                const message = typeof response.reason === 'object' ? response.reason.message : `request failed: ${code}`;
                const err = new AceBaseRequestError(request, response, code, message);
                reject(err);
            }
        }
    };
    socket.on("result", handle);

    return promise;
}

/**
 * Api to connect to a remote AceBase server over http(s)
 */
class WebApi extends Api {

    constructor(dbname = "default", settings, callback) {
        // operations are done through http calls,
        // events are triggered through a websocket
        super();

        this._id = ID.generate(); // For mutation contexts, not using websocket client id because that might cause security issues
        this.url = settings.url;
        this._autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this.dbname = dbname;
        this._connected = false;
        this._connecting = false;
        if (settings.cache && settings.cache.enabled !== false) {
            this._cache = {
                db: settings.cache.db,
                priority: settings.cache.priority || 'server'
            };
        }
        this._realtimeQueries = {};
        this.debug = settings.debug;
        this._connectHooks = [];
        const eventCallback = (name, ...args) => {
            if (name === 'connect') {
                const callbacks = this._connectHooks;
                this._connectHooks = [];
                callbacks.forEach(callback => {
                    try { callback(); }
                    catch(err) {}
                });
            }
            callback(name, ...args);
        };

        let subscriptions = this._subscriptions = {};
        let accessToken;

        this.connect = () => {            
            if (this.socket !== null && typeof this.socket === 'object') {
                this.disconnect();
            }
            this._connecting = true;
            this.debug.log(`Connecting to AceBase server "${this.url}"`);
            if (!this.url.startsWith('https')) {
                this.debug.warn(`WARNING: The server you are connecting to does not use https, any data transferred may be intercepted!`.colorize(ColorStyle.red))
            }
    
            return new Promise((resolve, reject) => {
                const socket = this.socket = connectSocket(this.url);

                socket.on("reconnect_attempt", () => {
                    this._connecting = true;
                });

                socket.on("reconnect_error", (err) => {
                    this._connecting = false;
                });

                socket.on("reconnect_failed", (err) => {
                    // Reconnecting failed
                    const scheduleRetry = () => {
                        // Try connecting again in a minute
                        setTimeout(() => { this.connect().catch(err => { scheduleRetry(); }); }, 60 * 1000);
                    };
                    if (typeof window !== 'undefined') {
                        // Monitor browser online event
                        const listener = () => {
                            window.removeEventListener('online', listener);
                            scheduleRetry();
                        }
                        window.addEventListener('online', listener);
                    }
                    else {
                        scheduleRetry();
                    }
                });

                socket.on("connect_error", (data) => {
                    // New connection failed to establish
                    this._connected = false;
                    this.debug.error(`Websocket connection error: ${data}`);
                    reject(new Error(`connect_error: ${data}`));
                });

                socket.on("connect_timeout", (data) => {
                    // New connection failed to establish
                    this._connected = false;
                    this.debug.error(`Websocket connection timeout`);
                    reject(new Error(`connect_timeout`));
                });

                socket.on("connect", (data) => {
                    this._connecting = false;
                    this._connected = true;
                    // eventCallback && eventCallback('connect');

                    // Sign in
                    let signInPromise = Promise.resolve();
                    if (accessToken) {
                        // User must be signed in again (NOTE: this does not trigger "signin" event)
                        signInPromise = this.signInWithToken(accessToken);
                    }
                    signInPromise.then(() => {
                        // (re)subscribe to any active subscriptions
                        const subscribePromises = [];
                        Object.keys(subscriptions).forEach(path => {
                            const events = [];
                            subscriptions[path].forEach(subscr => {
                                if (subscr.event === 'mutated') { return; } // Skip mutated events for now
                                const serverAlreadyNotifying = events.includes(subscr.event);
                                if (!serverAlreadyNotifying) {
                                    events.push(subscr.event);
                                    const promise = _websocketRequest(this.socket, 'subscribe', { path, event: subscr.event }, accessToken);
                                    subscribePromises.push(promise.catch(err => { console.error(err); }));
                                }
                            });
                        });
                        // Now, subscribe to all top path mutated events
                        Object.keys(subscriptions)
                            .filter(path => subscriptions[path].some(sub => sub.event === 'mutated'))
                            .filter((path, i, arr) => !arr.some(otherPath => PathInfo.get(otherPath).isAncestorOf(path)))
                            .forEach(topEventPath => {
                                const promise = _websocketRequest(this.socket, 'subscribe', { path: topEventPath, event: 'mutated' }, accessToken);
                                subscribePromises.push(promise.catch(err => { console.error(err); }));
                            });
                        return Promise.all(subscribePromises);
                    })
                    .then(() => {
                        eventCallback && eventCallback('connect'); // Safe to let client know we're connected
                        resolve(); // Resolve the .connect() promise
                    });
                });

                socket.on("disconnect", (data) => {
                    // Existing connection was broken, by us or network
                    this._connected = false;
                    eventCallback && eventCallback('disconnect');
                });

                socket.on("data-event", data => {
                    const val = Transport.deserialize(data.val);
                    const context = data.context || {};
                    context.acebase_event_source = 'server';

                    /*
                        Using the new context, we can determine how we should handle this data event.
                        From client v0.9.29 on, the set and update API methods add an acebase_mutation object
                        to the context with the following info:

                        client_id: which client initiated the mutation (web api instance, also different per browser tab)
                        id: a unique id of the mutation
                        op: operation used: 'set' or 'update'
                        path: the path the operation was executed on
                        flow: the flow used: 
                            - 'server': app was connected, cache was not used.
                            - 'cache': app was offline while mutating, now syncs its change
                            - 'parallel': app was connected, cache was used and updated

                        To determine how to handle this data event, we have to know what events may have already
                        been fired.

                        [Mutation initiated:]
                            - Cache database used?
                                - No -> 'server' flow
                                - Yes -> Client was online/connected?
                                    - No -> 'cache' flow (saved to cache db, sycing once connected)
                                    - Yes -> 'parallel' flow
                        
                        During 'cache' and 'parallel' flow, any change events will have fired on the cache database
                        already. If we are receiving this data event on the same client, that means we don't have to
                        fire those events again. If we receive this event on a different client, we only have to fire 
                        events if they change cached data.

                        [Change event received:]
                            - Is mutation done by us?
                                - No -> Are we using cache?
                                    - No -> Fire events
                                    - Yes -> Update cache with events disabled*, fire events
                                - Yes -> Are we using cache?
                                    - No -> Fire events ourself
                                    - Yes -> Skip cache update, don't fire events (both done already)

                        * Different browser tabs use the same cache database. If we would let the cache database fire data change
                        events, they would only fire in 1 browser tab - the first one to update the cache, the others will see 
                        no changes because the data will have been updated already.

                        NOTE: While offline, the in-memory state of 2 separate browser tabs will go out of sync
                        because they rely on change notifications from the server - to tackle this problem, 
                        cross-tab communication must be implemented. (TODO: Let cache database change notifications
                        be sent to other tabs, and let them use the same client ID for server communications)
                    */
                    const causedByUs = context.acebase_mutation && context.acebase_mutation.client_id === this._id;
                    const cacheEnabled = !!(this._cache && this._cache.db);
                    const fireThisEvent = !causedByUs || !cacheEnabled;
                    const updateCache = !causedByUs && cacheEnabled;
                    const fireCacheEvents = false; // See above flow documentation

                    // console.log(`${this._cache ? `[${this._cache.db.api.storage.name}] ` : ''}Received data event "${data.event}" on path "${data.path}":`, val);
                    // console.log(`Received data event "${data.event}" on path "${data.path}":`, val);
                    const pathSubs = subscriptions[data.subscr_path];

                    if (!pathSubs && data.event !== 'mutated') { 
                        // NOTE: 'mutated' events fire on the mutated path itself. 'mutations' events fire on subscription path

                        // We are not subscribed on this path. Happens when an event fires while a server unsubscribe 
                        // has been requested, but not processed yet: the local subscription will be gone already.
                        // This can be confusing when using cache, an unsubscribe may have been requested after a cache
                        // event fired - the server event will follow but we're not listening anymore!
                        // this.debug.warn(`Received a data-event on a path we did not subscribe to: "${data.subscr_path}"`);
                        return;
                    }
                    if (updateCache) {
                        if (data.path.startsWith('__')) {
                            // Don't cache private data. This happens when the admin user is signed in 
                            // and has an event subscription on the root, or private path.
                            // NOTE: fireThisEvent === true, because it is impossible that this mutation was caused by us (well, it should be!)
                        }
                        else if (data.event === 'mutations') {
                            // Apply all mutations
                            const mutations = val.current;
                            mutations.forEach(m => {
                                const path = m.target.reduce((path, key) => PathInfo.getChildPath(path, key), PathInfo.getChildPath(`${this.dbname}/cache`, data.path));
                                this._cache.db.api.set(path, m.val, { suppress_events: !fireCacheEvents, context });
                            });
                        }
                        else if (data.event === 'notify_child_removed') {
                            this._cache.db.api.set(PathInfo.getChildPath(`${this.dbname}/cache`, data.path), null, { suppress_events: !fireCacheEvents, context }); // Remove cached value
                        }
                        else if (!data.event.startsWith('notify_')) {
                            this._cache.db.api.set(PathInfo.getChildPath(`${this.dbname}/cache`, data.path), val.current, { suppress_events: !fireCacheEvents, context }); // Update cached value
                        }
                    }
                    if (!fireThisEvent) {
                        return;
                    }
                    // CHANGED - Only fire events if they were not triggered by the cache db already (and they only fired if the cached data really changed!)
                    // The last point in the comment above is why I changed this. If the local cache does not change, no events will be fired. This causes an
                    // issue in browser contexts when there are multiple open tabs: they share the same cache database and if 1 tab makes changes to the cache, 
                    // other clients won't know about it, and will not be notified of any changes.
                    // TODO: Implement cross-tab notifications in acebase/src/acebase-browser.js
                    const targetSubs = data.event === 'mutated'
                        ? Object.keys(subscriptions)
                            .filter(path => {
                                const pathInfo = PathInfo.get(path);
                                return path === data.path || pathInfo.equals(data.subscr_path) || pathInfo.isAncestorOf(data.path)
                            })
                            .reduce((subs, path) => {
                                const add = subscriptions[path].filter(sub => sub.event === 'mutated');
                                subs.push(...add);
                                return subs;
                            }, [])
                        : pathSubs.filter(sub => sub.event === data.event);
                    
                    targetSubs.forEach(subscr => { // !eventsFired && 
                        subscr.callback(null, data.path, val.current, val.previous, context);
                    });
                });

                socket.on("query-event", data => {
                    data = Transport.deserialize(data);
                    const query = this._realtimeQueries[data.query_id];
                    let keepMonitoring = true;
                    try {
                        keepMonitoring = query.options.eventHandler(data);
                    }
                    catch(err) {
                        keepMonitoring = false;
                    }
                    if (keepMonitoring === false) {
                        delete this._realtimeQueries[data.query_id];
                        socket.emit("query_unsubscribe", { query_id: data.query_id });
                    }
                });
            });
        };

        if (this._autoConnect) {
            this.connect();
        }

        this.disconnect = () => {
            if (this.socket !== null && typeof this.socket === 'object') {
                this.socket.disconnect();
                this.socket = null;
            }
            this._connected = false;
            this._connecting = false;
        }

        this.subscribe = (path, event, callback) => {
            let pathSubs = subscriptions[path];
            if (!pathSubs) { pathSubs = subscriptions[path] = []; }
            let serverAlreadyNotifying = pathSubs.some(sub => sub.event === event)
                || (event === 'mutated' && Object.keys(subscriptions).some(otherPath => PathInfo.get(otherPath).isAncestorOf(path) && subscriptions[otherPath].some(sub => sub.event === event)));
            const subscr = { path, event, callback };
            pathSubs.push(subscr);

            if (this._cache) {
                // Events are also handled by cache db
                subscr.cacheCallback = (err, path, newValue, oldValue, context) => subscr.callback(err, path.slice(`${this.dbname}/cache/`.length), newValue, oldValue, context);
                this._cache.db.api.subscribe(PathInfo.getChildPath(`${this.dbname}/cache`, path), event, subscr.cacheCallback);
            }

            if (serverAlreadyNotifying || !this._connected) {
                return Promise.resolve();
            }
            if (event === 'mutated') {
                // Unsubscribe from 'mutated' events set on descendant paths of current path
                Object.keys(subscriptions)
                .filter(otherPath => 
                    PathInfo.get(otherPath).isDescendantOf(path) 
                    && subscriptions[otherPath].some(sub => sub.event === 'mutated')
                )
                .map(path => _websocketRequest(this.socket, "unsubscribe", { path, event: 'mutated' }, accessToken))
                .map(promise => promise.catch(err => console.error(err)))
            }
            return _websocketRequest(this.socket, "subscribe", { path, event }, accessToken);
        };

        this.unsubscribe = (path, event = undefined, callback = undefined) => {
            let pathSubs = subscriptions[path];
            if (!pathSubs) { return Promise.resolve(); }

            const unsubscribeFrom = (subscriptions) => {
                subscriptions.forEach(subscr => {
                    pathSubs.splice(pathSubs.indexOf(subscr), 1);
                    if (this._cache) {
                        // Events are also handled by cache db, also remove those
                        console.assert(typeof subscr.cacheCallback !== 'undefined', 'When subscription was added, cacheCallback must have been set');
                        this._cache.db.api.unsubscribe(PathInfo.getChildPath(`${this.dbname}/cache`, path), subscr.event, subscr.cacheCallback);
                    }
                });
            };

            const hadMutatedEvents = pathSubs.some(sub => sub.event === 'mutated');
            if (!event) {
                // Unsubscribe from all events on path
                unsubscribeFrom(pathSubs);
            }
            else if (!callback) {
                // Unsubscribe from specific event on path
                const subscriptions = pathSubs.filter(subscr => subscr.event === event);
                unsubscribeFrom(subscriptions);
            }
            else {
                // Unsubscribe from a specific callback on path event
                const subscriptions = pathSubs.filter(subscr => subscr.event === event && subscr.callback === callback);
                unsubscribeFrom(subscriptions);
            }
            const hasMutatedEvents = pathSubs.some(sub => sub.event === 'mutated');

            let promise = Promise.resolve();
            if (pathSubs.length === 0) {
                // Unsubscribed from all events on path
                delete subscriptions[path];
                if (this._connected) {
                    promise = _websocketRequest(this.socket, 'unsubscribe', { path, access_token: accessToken }, accessToken);
                }
            }
            else if (this._connected && !pathSubs.some(subscr => subscr.event === event)) {
                // No callbacks left for specific event
                promise = _websocketRequest(this.socket, 'unsubscribe', { path: path, event, access_token: accessToken }, accessToken);
            }
            if (this._connected && hadMutatedEvents && !hasMutatedEvents) {
                // If any descendant paths have mutated events, resubscribe those
                const promises = Object.keys(subscriptions)
                    .filter(otherPath => PathInfo.get(otherPath).isDescendantOf(path) && subscriptions[otherPath].some(sub => sub.event === 'mutated'))
                    .map(path => _websocketRequest(this.socket, 'subscribe', { path: path, event: 'mutated' }, accessToken))
                    .map(promise => promise.catch(err => console.error(err)));
                promise = Promise.all([promise, ...promises]);
            }
            return promise;
        };

        this.transaction = (path, callback, options = { context: {} }) => {
            const id = ID.generate();
            options.context = options.context || {};
            options.context.acebase_mutation = {
                client_id: this._id,
                id,
                op: 'transaction',
                path,
                flow: 'server'
            };
            const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
            let cacheUpdateVal;
            const startedCallback = (data) => {
                if (data.id === id) {
                    this.socket.off("tx_started", startedCallback);
                    const currentValue = Transport.deserialize(data.value);
                    const val = callback(currentValue);
                    const finish = (val) => {
                        const newValue = Transport.serialize(val);
                        this.socket.emit("transaction", { action: "finish", id: id, path, value: newValue, access_token: accessToken });
                        if (this._cache) {
                            cacheUpdateVal = val;
                        }
                    };
                    if (val instanceof Promise) {
                        val.then(finish);
                    }
                    else {
                        finish(val);
                    }
                }
            }
            let txResolve, txReject, txPromise = new Promise((resolve, reject) => {
                txResolve = resolve;
                txReject = reject;
            });
            const handleSuccess = () => {
                if (this._cache && typeof cacheUpdateVal !== 'undefined') {
                    // Update cache db value
                    this._cache.db.api.set(cachePath, cacheUpdateVal).then(() => {
                        txResolve(this);
                    })
                }
                else {
                    txResolve(this);
                }
            };
            const handleFailure = err => {
                txReject(err);
            }
            const completedCallback = (data) => {
                if (data.id === id) {
                    this.socket.off("tx_completed", completedCallback);
                    handleSuccess();
                }
            }
            const connectedCallback = () => {
                this.socket.on("tx_started", startedCallback);
                this.socket.on("tx_completed", completedCallback);
                // TODO: socket.on('disconnect', disconnectedCallback);
                this.socket.emit("transaction", { action: "start", id, path, access_token: accessToken, context: options.context });
            };
            if (this._connected) { 
                connectedCallback(); 
            }
            else { 
                // Websocket might not be connected. Try http call instead
                const data = JSON.stringify({ path });
                this._request({ ignoreConnectionState: true, method: "POST", url: `${this.url}/transaction/${this.dbname}/start`, data, context: options.context })
                .then(tx => {
                    const id = tx.id;
                    const currentValue = Transport.deserialize(tx.value);
                    const value = callback(currentValue);
                    const data = JSON.stringify({ id, value: Transport.serialize(value) });
                    return this._request({ ignoreConnectionState: true, method: "POST", url: `${this.url}/transaction/${this.dbname}/finish`, data, context: options.context })
                })
                .catch(err => {
                    if (['ETIMEDOUT','ENOTFOUND','ECONNRESET','ECONNREFUSED','EPIPE'].includes(err.code)) {
                        err.message = NOT_CONNECTED_ERROR_MESSAGE;
                        // handleFailure(new Error(NOT_CONNECTED_ERROR_MESSAGE));
                    }
                    handleFailure(err);
                });
            }
            return txPromise;
        };

        /**
         * @param {object} options 
         * @param {string} options.url
         * @param {'GET'|'PUT'|'POST'|'DELETE'} [options.method='GET']
         * @param {any} [options.data] Data to post when method is PUT or POST
         * @param {any} [options.context] Context to add to PUT or POST requests
         * @param {(chunk: string) => void} [options.dataReceivedCallback] A method that overrides the default data receiving handler. Override for streaming.
         * @param {boolean} [options.ignoreConnectionState=false] Whether to try the request even if there is no connection
         */
        this._request = (options) => {
            if (this._connected || options.ignoreConnectionState === true) { 
                return _request(options.method || 'GET', options.url, { data: options.data, accessToken, dataReceivedCallback: options.dataReceivedCallback, context: options.context })
                .catch(err => {
                    throw err;
                });
            }
            else {
                // We're not connected. We can wait for the connection to be established,
                // or fail the request now. Because we have now implemented caching, live requests
                // are only executed if they are not allowed to use cached responses. Wait for a
                // connection to be established (max 1s), then retry or fail

                if (!this._connecting) {
                    // We're currently not trying to connect. Fail now
                    return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
                }

                let resolve, reject, 
                    promise = new Promise((rs, rj) => { resolve = rs; reject = rj; }),
                    state = 'wait',
                    timeout = setTimeout(() => {
                        if (state !== 'wait') { return; }
                        state = 'timeout';
                        this.socket.off('connect', callback); // Cancel connect wait
                        reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
                    }, 1000),
                    callback = () => {
                        if (state !== 'wait') { return; }
                        state = 'connected';
                        clearTimeout(timeout); // Cancel timeout
                        this._request(options)
                        .then(resolve)
                        .catch(reject);
                    };
                this.socket.on('connect', callback); // wait for connection
                return promise;
            }
        };

        this.signIn = (username, password) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'account', username, password, client_id: this.socket.id } })
            .then(result => {
                accessToken = result.access_token;
                // Make sure the connected websocket server knows who we are as well. 
                // (this is currently not necessary because the server does not support clustering yet, 
                // but future versions might be connected to a different instance than the one that 
                // handled the signin http request just now)
                this.socket.emit("signin", accessToken);
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.signInWithEmail = (email, password) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'email', email, password, client_id: this.socket.id } })
            .then(result => {
                accessToken = result.access_token;
                this.socket.emit("signin", accessToken); // Make sure the connected websocket server knows who we are as well. 
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.signInWithToken = (token) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'token', access_token: token, client_id: this.socket.id } })
            .then(result => {
                accessToken = result.access_token;
                this.socket.emit("signin", accessToken); // Make sure the connected websocket server knows who we are as well. 
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.startAuthProviderSignIn = (providerName, callbackUrl) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ url: `${this.url}/oauth2/${this.dbname}/init?provider=${providerName}&callbackUrl=${callbackUrl}` })
            .then(result => {
                return { redirectUrl: result.redirectUrl };
            })
            .catch(err => {
                throw err;
            });
        }

        this.finishAuthProviderSignIn = (callbackResult) => {
            /** @type {{ provider: { name: string, access_token: string, refresh_token: string, expires_in: number }, access_token: string, user: AceBaseUser }} */
            let result;
            try {
                result = JSON.parse(Buffer.from(callbackResult, 'base64').toString('utf8'));
                // TODO: Implement server check
            }
            catch(err) {
                return Promise.reject(`Invalid result`);
            }
            accessToken = result.access_token;
            this.socket.emit("signin", accessToken); // Make sure the connected websocket server knows who we are as well. 
            return Promise.resolve({ user: result.user, accessToken, provider: result.provider });
        }

        this.refreshAuthProviderToken = (providerName, refreshToken) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ url: `${this.url}/oauth2/${this.dbname}/refresh?provider=${providerName}&refresh_token=${refreshToken}` })
            .then(result => {
                return result;
            })
            .catch(err => {
                throw err;
            });
        }

        this.signOut = (everywhere = false) => {
            if (!accessToken) { return Promise.resolve(); }
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signout`, data: { client_id: this.socket.id, everywhere } })
            .then(() => {
                this.socket.emit("signout", accessToken); // Make sure the connected websocket server knows we signed out as well. 
                accessToken = null;
            })
            .catch(err => {
                throw err;
            });
        };

        this.changePassword = (uid, currentPassword, newPassword) => {
            if (!accessToken) { return Promise.reject(new Error(`not_signed_in`)); }
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/change_password`, data: { uid, password: currentPassword, new_password: newPassword } })
            .then(result => {
                accessToken = result.access_token;
                return { accessToken };
            })
            .catch(err => {
                throw err;
            });
        };
    
        this.forgotPassword = (email) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/forgot_password`, data: { email } })
            .catch(err => {
                throw err;
            });
        };

        this.verifyEmailAddress = (verificationCode) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/verify_email`, data: { code: verificationCode } })
            .catch(err => {
                throw err;
            });
        };

        this.resetPassword = (resetCode, newPassword) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/reset_password`, data: { code: resetCode, password: newPassword } })
            .catch(err => {
                throw err;
            });
        };

        this.signUp = (details, signIn = true) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signup`, data: details })
            .then(result => {
                if (signIn) {
                    accessToken = result.access_token;
                    this.socket.emit("signin", accessToken);
                }
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.updateUserDetails = (details) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/update`, data: details })
            .then(result => {
                return { user: result.user };
            })
            .catch(err => {
                throw err;
            });
        }

        this.deleteAccount = (uid, signOut = true) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/delete`, data: { uid } })
            .then(result => {
                if (signOut) {
                    this.socket.emit("signout", accessToken);
                    accessToken = null;
                }
                return true;
            })
            .catch(err => {
                throw err;
            });
        }
    }

    stats(options = undefined) {
        return this._request({ url: `${this.url}/stats/${this.dbname}` });
    }

    sync(options = { fetchFreshData: true, eventCallback: null }) {
        // Sync cache
        if (!this._connected) {
            return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
        }
        // if (!this._cache) {
        //     return Promise.reject(new Error(`no cache database is used`));
        // }
        if (this._cache && !this._cache.db.isReady) {
            return Promise.reject(new Error(`cache database is not ready yet`));
        }

        options.eventCallback && options.eventCallback('sync_start');
        const handleStatsUpdateError = err => {
            this.debug.error(`Failed to update cache db stats:`, err);
        }
        let totalPendingChanges = 0;
        const cacheApi = this._cache && this._cache.db.api;
        let syncPushPromise = Promise.resolve();
        if (this._cache) {
            syncPushPromise = cacheApi.get(`${this.dbname}/pending`)
            .then(pendingChanges => {
                cacheApi.set(`${this.dbname}/stats/last_sync_start`, new Date()).catch(handleStatsUpdateError);
                if (pendingChanges === null) {
                    return; // No updates
                }
                return Object.keys(pendingChanges)
                    .sort((a,b) => a < b ? 1 : -1) // sort z-a
                    .reduce((netChangeIds, id) => {
                        // Only get effective changes: 
                        // ignore operations preceeding a 'set' or 'remove' operation on the same and descendant paths
                        const change = pendingChanges[id];
                        // Check if the change is about a path that is 'set' or 'remove'd later (earlier in our sort order...)
                        const pathInfo = PathInfo.get(change.path);
                        const ignore = netChangeIds.some(id => {
                            const laterChange = pendingChanges[id];
                            return (laterChange.path === change.path || pathInfo.isDescendantOf(laterChange.path)) && ['set','remove'].includes(laterChange.type);
                        })
                        if (!ignore) {
                            netChangeIds.push(id);
                        }
                        else {
                            delete pendingChanges[id];
                            cacheApi.set(`${this.dbname}/pending/${id}`, null); // delete from cache db
                        }
                        return netChangeIds;
                    }, [])
                    .sort() // sort a-z
                    .reduce((prevPromise, id) => {
                        // Now process the net changes
                        const change = pendingChanges[id];
                        this.debug.verbose(`SYNC processing change ${id}: `, change);
                        totalPendingChanges++;
                        const go = () => {
                            let promise;
                            if (change.type === 'update') { 
                                promise = this.update(change.path, change.data, { allow_cache: false, context: change.context });
                            }
                            else if (change.type === 'set') { 
                                if (!change.data) { change.data = null; } // Before type 'remove' was implemented
                                promise = this.set(change.path, change.data, { allow_cache: false, context: change.context });
                            }
                            else if (change.type === 'remove') {
                                promise = this.set(change.path, null, { allow_cache: false, context: change.context });
                            }
                            else {
                                throw new Error(`unsupported change type "${change.type}"`);
                            }
                            return promise
                            .then(() => {
                                this.debug.verbose(`SYNC change ${id} processed ok`);
                                delete pendingChanges[id];
                                cacheApi.set(`${this.dbname}/pending/${id}`, null); // delete from cache db
                            })
                            .catch(err => {
                                // Updating remote db failed
                                this.debug.error(`SYNC change ${id} failed: ${err.message}`);
                                if (!this._connected) {
                                    // Connection was broken, should retry later
                                    throw err;
                                }
                                // We are connected, so the change is not allowed or otherwise denied.
                                if (typeof err === 'string') { 
                                    err = { code: 'unknown', message: err, stack: 'n/a' }; 
                                }
                                cacheApi.set(`${this.dbname}/stats/last_sync_error`, { date: new Date(), code: err.code || 'unknown', message: err.message, stack: err.stack }).catch(handleStatsUpdateError);
                                // Delete the change and cached data
                                cacheApi.set(`${this.dbname}/pending/${id}`, null);
                                cacheApi.set(PathInfo.getChildPath(`${this.dbname}/cache`, change.data.path), null);
                                options.eventCallback && options.eventCallback('sync_change_error', { error: err, change });
                            });
                        };
                        return prevPromise.then(go); // Chain to previous promise
                    }, Promise.resolve());
            })
            .then(() => {
                this.debug.verbose(`SYNC push done`);
                cacheApi.set(`${this.dbname}/stats/last_sync_end`, new Date()).catch(handleStatsUpdateError);
                return totalPendingChanges;
            })
            .catch(err => {
                // 1 or more pending changes could not be processed.
                this.debug.error(`SYNC push error: ${err.message}`);
                if (typeof err === 'string') { 
                    err = { code: 'unknown', message: err, stack: 'n/a' }; 
                }
                cacheApi.set(`${this.dbname}/stats/last_sync_error`, { date: new Date(), code: err.code || 'unknown', message: err.message, stack: err.stack }).catch(handleStatsUpdateError);
                throw err;
            });            
        }
        let totalRemoteChanges = 0;
        return syncPushPromise
        .then(() => {
            // We've pushed our changes, now get fresh data for all paths with active subscriptions
            if (this._cache && options.fetchFreshData) {
                // Find out what data to load
                const loadPaths = Object.keys(this._subscriptions).reduce((paths, path) => {
                    const isWildcardPath = path.includes('*') || path.includes('$');
                    if (!paths.includes(path) && !isWildcardPath) {
                        const hasValueSubscribers = this._subscriptions[path].some(s => s.event !== 'mutated' && !s.event.startsWith('notify_'));
                        if (hasValueSubscribers) {
                            const pathInfo = PathInfo.get(path);
                            const ancestorIncluded = paths.some(otherPath => pathInfo.isDescendantOf(otherPath));
                            if (!ancestorIncluded) { paths.push(path); }
                        }
                    }
                    return paths;
                }, []);
                // Attach temp events to cache db so they will fire for data changes (just for counting)
                Object.keys(this._subscriptions).forEach(path => {
                    this._subscriptions[path].forEach(subscr => {
                        subscr.tempCallback = (err, path, newValue, oldValue, context) => {
                            totalRemoteChanges++;
                        }
                        cacheApi.subscribe(PathInfo.getChildPath(`${this.dbname}/cache`, subscr.path), subscr.event, subscr.tempCallback);
                    });
                });
                // Fetch new data
                const syncPullPromises = loadPaths.map(path => {
                    this.debug.verbose(`SYNC pull "${path}"`);
                    return this.get(path, { allow_cache: false })
                    .catch(err => {
                        this.debug.error(`SYNC pull error`, err);
                        options.eventCallback && options.eventCallback('sync_pull_error', err);
                    });
                });
                return Promise.all(syncPullPromises)
                .then(() => {
                    // Unsubscribe temp cache subscriptions
                    Object.keys(this._subscriptions).forEach(path => {
                        this._subscriptions[path].forEach(subscr => {
                            if (typeof subscr.tempCallback !== 'function') { 
                                // If a subscription was added while synchronizing, it won't have a tempCallback.
                                // This is no big deal, since our tempCallback is only to update sync statistics.
                                // Before acebase-client v0.9.29, this caused all subscriptions with current path
                                // and type to be removed.
                                return; 
                            }
                            cacheApi.unsubscribe(PathInfo.getChildPath(`${this.dbname}/cache`, subscr.path), subscr.event, subscr.tempCallback);
                            delete subscr.tempCallback;
                        });
                    });
                });
            }
            else if (!this._cache) {
                // Not using cache, so there is no real way of knowing if anything changed or removed.
                // We could trigger fake "value", "child_added" and "child_changed" events with fresh data, 
                // but... what's the use? It would result in broken data? 
                // --> Let's run "value" events only, and warn about all other events

                const syncPullPromises = [];
                Object.keys(this._subscriptions).forEach(path => {
                    const subs = this._subscriptions[path];
                    const valueSubscriptions = subs.filter(s => s.event === 'value');
                    if (valueSubscriptions.length === 0) {
                        return subs.forEach(sub => this.debug.warn(`Subscription "${sub.event}" on path "${path}" might have missed events while offline. Data should be reloaded!`));
                    }
                    const p = this.get(path, { allow_cache: false }).then(value => {
                        valueSubscriptions.forEach(subscr => subscr.callback(null, path, value));
                    });
                    syncPullPromises.push(p);
                });
                return Promise.all(syncPullPromises);
            }
        })
        .then(() => {
            this.debug.verbose(`SYNC done`);
            const info = { local: totalPendingChanges, remote: totalRemoteChanges };
            options.eventCallback && options.eventCallback('sync_done', info);
            return info;
        })
        .catch(err => {
            this.debug.error(`SYNC error`, err);
            options.eventCallback && options.eventCallback('sync_error', err);
            throw err;
        });
    }

    set(path, value, options = { allow_cache: true, context: {} }) {
        if (!options.context) { options.context = {}; }
        const useCache = this._cache && options.allow_cache !== false;
        const useServer = this._connected;
        options.context.acebase_mutation = options.context.acebase_mutation || {
            client_id: this._id,
            id: ID.generate(),
            op: 'set',
            path,
            flow: useCache ? useServer ? 'parallel' : 'cache' : 'server'
        };
        const updateServer = () => {
            const data = JSON.stringify(Transport.serialize(value));
            return this._request({ method: "PUT", url: `${this.url}/data/${this.dbname}/${path}`, data, context: options.context })
        };
        if (!useCache) {
            return updateServer();
        }

        const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
        let rollbackValue;
        const updateCache = () => {
            return this._cache.db.api.transaction(cachePath, (currentValue) => {
                rollbackValue = currentValue;
                return value;
            }, { context: options.context });
        };
        const rollbackCache = () => {
            return this._cache.db.api.set(cachePath, rollbackValue, { context: options.context });
        };
        const addPendingTransaction = () => {
            return this._cache.db.api.set(`${this.dbname}/pending/${options.context.acebase_mutation.id}`, { type: 'set', path, data: value, context: options.context });
        };

        const cachePromise = updateCache()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        const serverPromise = !useServer ? null : updateServer()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        Promise.all([ cachePromise, serverPromise ])
        .then(([ cacheResult, serverResult ]) => {
            if (serverPromise) {
                // Server was being updated

                if (serverResult.success) {
                    // Server update success
                    if (!cacheResult.success) { 
                        // Cache update failed for some reason?
                        this.debug.error(`Failed to set cache for "${path}". Error: `, cacheResult.error);
                    }
                }
                else {
                    // Server update failed
                    if (cacheResult.success) {
                        // Cache update did succeed, rollback to previous value
                        this.debug.error(`Failed to set server value for "${path}", rolling back cache to previous value. Error:`, serverResult.error)
                        rollbackCache().catch(err => {
                            this.debug.error(`Failed to roll back cache? Error:`, err);
                        });
                    }
                }
            }
            else if (cacheResult.success) {
                // Server was not updated, cache update was successful.
                // Add pending sync action

                addPendingTransaction().catch(err => {
                    this.debug.error(`Failed to add pending sync action for "${path}", rolling back cache to previous value. Error:`, err);
                    rollbackCache().catch(err => {
                        this.debug.error(`Failed to roll back cache? Error:`, err);
                    });
                });
            }
        })

        // return server promise by default, so caller can handle potential authorization issues
        return this._cache.priority === 'cache' ? cachePromise : serverPromise;
    }

    update(path, updates, options = { allow_cache: true, context: {} }) {
        const useCache = this._cache && options && options.allow_cache !== false;
        const useServer = this._connected;
        options.context.acebase_mutation = options.context.acebase_mutation || {
            client_id: this._id,
            id: ID.generate(),
            op: 'update',
            path,
            flow: useCache ? useServer ? 'parallel' : 'cache' : 'server'
        };
        const updateServer = () => {
            const data = JSON.stringify(Transport.serialize(updates));
            return this._request({ method: "POST", url: `${this.url}/data/${this.dbname}/${path}`, data, context: options.context });
        };
        if (!useCache) {
            return updateServer();
        }

        const cacheApi = this._cache.db.api;
        const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
        let rollbackUpdates;
        const updateCache = () => {
            const properties = Object.keys(updates);
            return cacheApi.get(cachePath, { include: properties })
            .then(currentValues => {
                rollbackUpdates = currentValues;
                return cacheApi.update(cachePath, updates, { context: options.context });
            });
        };
        // const deleteCache = () => {
        //     return this._cache.db.api.set(`${this.dbname}/cache/${path}`, null);
        // };
        const rollbackCache = () => {
            return cacheApi.update(cachePath, rollbackUpdates, { context: options.context });
        };
        const addPendingTransaction = () => {
            return cacheApi.set(`${this.dbname}/pending/${options.context.acebase_mutation.id}`, { type: 'update', path, data: updates, context: options.context });
        };

        const cachePromise = updateCache()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        const serverPromise = !useServer ? null : updateServer()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        Promise.all([ cachePromise, serverPromise ])
        .then(([ cacheResult, serverResult ]) => {
            if (serverPromise) {
                // Server was being updated

                if (serverResult.success) {
                    // Server update success
                    if (!cacheResult.success) { 
                        // Cache update failed for some reason?
                        this.debug.error(`Failed to update cache for "${path}". Error: `, cacheResult.error);
                    }
                }
                else {
                    // Server update failed
                    if (cacheResult.success) {
                        // Cache update did succeed, rollback to previous value
                        this.debug.error(`Failed to update server value for "${path}", rolling back cache to previous value. Error:`, serverResult.error)
                        rollbackCache().catch(err => {
                            this.debug.error(`Failed to roll back cache? Error:`, err);
                        });
                    }
                }
            }
            else if (cacheResult.success) {
                // Server was not updated, cache update was successful.
                // Add pending sync action

                addPendingTransaction().catch(err => {
                    this.debug.error(`Failed to add pending sync action for "${path}", rolling back cache to previous value. Error:`, err);
                    rollbackCache().catch(err => {
                        this.debug.error(`Failed to roll back cache? Error:`, err);
                    });
                });
            }
        })

        // return server promise by default, so caller can handle potential authorization issues
        return this._cache.priority === 'cache' ? cachePromise : serverPromise;
    }

    get(path, options = { allow_cache: true }) {
        const useCache = this._cache && options.allow_cache !== false;
        const getServerValue = () => {
            // Get from server
            let url = `${this.url}/data/${this.dbname}/${path}`;
            let filtered = false;
            if (options) {
                let query = [];
                if (options.exclude instanceof Array) { 
                    query.push(`exclude=${options.exclude.join(',')}`); 
                }
                if (options.include instanceof Array) { 
                    query.push(`include=${options.include.join(',')}`); 
                }
                if (typeof options.child_objects === "boolean") {
                    query.push(`child_objects=${options.child_objects}`);
                }
                if (query.length > 0) {
                    filtered = true;
                    url += `?${query.join('&')}`;
                }
            }
            return this._request({ url })
            .then(data => {
                let val = Transport.deserialize(data);
                if (this._cache) {
                    // Update cache
                    // DISABLED: if filtered data was requested, it should be merged with current data (nested objects in particular)
                    // TODO: do update if no nested filters are used.
                    // if (filtered) {
                    //     this._cache.db.api.update(`${this.dbname}/cache/${path}`, val);
                    // }
                    // else if (!filtered) { 
                    if (!filtered) {
                        const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
                        return this._cache.db.api.set(cachePath, val, { context: { acebase_operation: 'update_cache' } })
                        .catch(err => {
                            this.debug.error(`Error caching data for "/${path}"`, err)
                        })
                        .then(() => val);
                    }
                }
                return val;
            })
            .catch(err => {
                throw err;
            });
        };
        const getCacheValue = () => {
            return this._cache.db.api.get(PathInfo.getChildPath(`${this.dbname}/cache`, path), options);
        };

        if (!useCache) {
            return getServerValue();
        }
        else if (!this._connected || this._cache.priority === 'cache') {
            return getCacheValue();
        }
        else {
            // Get both, use cached value if available and server version takes too long
            return new Promise((resolve, reject) => {
                let wait = true, done = false;
                const gotValue = (source, val) => {
                    // console.log(`Got ${source} value of "${path}":`, val);
                    if (done) { return; }
                    if (source === 'server') {
                        done = true;
                        // console.log(`Using server value for "${path}"`);
                        resolve(val);
                    }
                    else if (val === null) {
                        // Cached results are not available
                        if (!wait) {
                            const error = new Error(`Value for "${path}" not found in cache, and server value could not be loaded. See serverError for more details`);
                            error.serverError = errors.find(e => e.source === 'server').error;
                            return reject(error); 
                        }
                    }
                    else if (!wait) { 
                        // Cached results, don't wait for server value
                        done = true; 
                        // console.log(`Using cache value for "${path}"`);
                        resolve(val); 
                    }
                    else {
                        // Cached results, wait 1s before resolving with this value, server value might follow soon
                        setTimeout(() => {
                            if (done) { return; }
                            console.log(`Using (delayed) cache value for "${path}"`);
                            done = true;
                            resolve(val);
                        }, 1000);
                    }
                };
                let errors = [];
                const gotError = (source, error) => {
                    errors.push({ source, error });
                    if (errors.length === 2) { 
                        // Both failed, reject with server error
                        reject(errors.find(e => e.source === 'server').error);
                    }
                };

                getServerValue()
                    .then(val => gotValue('server', val))
                    .catch(err => (wait = false, gotError('server', err)));

                getCacheValue()
                    .then(val => gotValue('cache', val))
                    .catch(err => gotError('cache', err));
            });
        }
    }
    
    exists(path, options = { allow_cache: true }) {
        const useCache = this._cache && options.allow_cache !== false;
        const getCacheExists = () => {
            return this._cache.db.api.exists(PathInfo.getChildPath(`${this.dbname}/cache`, path));
        };
        const getServerExists = () => {
            return this._request({ url: `${this.url}/exists/${this.dbname}/${path}` })
            .then(res => res.exists)
            .catch(err => {
                throw err;
            });            
        }
        if (!useCache) {
            return getServerExists();
        }
        else if (!this._connected) {
            return getCacheExists();
        }
        else {
            // Check both
            return new Promise((resolve, reject) => {
                let wait = true, done = false;
                const gotExists = (source, exists) => {
                    if (done) { return; }
                    if (source === 'server') {
                        done = true;
                        resolve(exists);
                    }
                    else if (!wait) { 
                        // Cached results, don't wait for server value
                        done = true; 
                        resolve(exists); 
                    }
                    else {
                        // Cached results, wait 1s before resolving with this value, server value might follow soon
                        setTimeout(() => {
                            if (done) { return; }
                            done = true;
                            resolve(exists);
                        }, 1000);
                    }
                };
                let errors = [];
                const gotError = (source, error) => {
                    errors.push({ source, error });
                    if (errors.length === 2) { 
                        // Both failed, reject with server error
                        reject(errors.find(e => e.source === 'server'));
                    }
                };

                getServerExists()
                    .then(exists => gotExists('server', exists))
                    .catch(err => (wait = false, gotError('server', err)));

                getCacheExists()
                    .then(exists => gotExists('cache', exists))
                    .catch(err => gotError('cache', err));
            });
        }
    }

    callExtension(method, path, data) {
        method = method.toUpperCase();
        const postData = ['PUT','POST'].includes(method) ? data : null;
        let url = `${this.url}/ext/${this.dbname}/${path}`;
        if (data && !['PUT','POST'].includes(method)) {
            // Add to query string
            if (typeof data === 'object') {
                // Convert object to querystring
                data = Object.keys(data)
                    .filter(key => typeof data[key] !== 'undefined')
                    .map(key => key + '=' + encodeURIComponent(JSON.stringify(data[key])))
                    .join('&')
            }
            else if (typeof data !== 'string' || !data.includes('=')) {
                throw new Error('data must be an object, or a string with query parameters, like "index=3&name=Something"');
            }
            url += `?` + data;
        }
        return this._request({ method, url, data: postData, ignoreConnectionState: true });
    }

    /**
     * 
     * @param {string} path 
     * @param {object} query 
     * @param {Array<{ key: string, op: string, compare: any}>} query.filters
     * @param {number} query.skip number of results to skip, useful for paging
     * @param {number} query.take max number of results to return
     * @param {Array<{ key: string, ascending: boolean }>} query.order
     * @param {object} [options]
     * @param {boolean} [options.snapshots=false] whether to return matching data, or paths to matching nodes only
     * @param {string[]} [options.include] when using snapshots, keys or relative paths to include in result data
     * @param {string[]} [options.exclude] when using snapshots, keys or relative paths to exclude from result data
     * @param {boolean} [options.child_objects] when using snapshots, whether to include child objects in result data
     * @param {(event: { name: string, [key]: any }) => void} [options.eventHandler]
     * @param {object} [options.monitor] NEW (BETA) monitor changes
     * @param {boolean} [options.monitor.add=false] monitor new matches (either because they were added, or changed and now match the query)
     * @param {boolean} [options.monitor.change=false] monitor changed children that still match this query
     * @param {boolean} [options.monitor.remove=false] monitor children that don't match this query anymore
     * @ param {(event:string, path: string, value?: any) => boolean} [options.monitor.callback] NEW (BETA) callback with subscription to enable monitoring of new matches
     * @returns {Promise<object[]|string[]>} returns a promise that resolves with matching data or paths
     */
    query(path, query, options = { snapshots: false, allow_cache: true, eventListener: undefined, monitor: { add: false, change: false, remove: false } }) {
        const allowCache = options && options.allow_cache === true;
        if (allowCache && !this._connected && this._cache) {
            // Not connected, query cache db
            return this._cache.db.api.query(PathInfo.getChildPath(`${this.dbname}/cache`, path), query, options);
        }
        const request = {
            query,
            options
        };
        if (options.monitor === true || (typeof options.monitor === 'object' && (options.monitor.add || options.monitor.change || options.monitor.remove))) {
            console.assert(typeof options.eventHandler === 'function', `no eventHandler specified to handle realtime changes`);
            request.query_id = ID.generate();
            request.client_id = this.socket.id;
            this._realtimeQueries[request.query_id] = { query, options };
        }
        const data = JSON.stringify(Transport.serialize(request));
        return this._request({ method: "POST", url: `${this.url}/query/${this.dbname}/${path}`, data })
        .then(data => {
            let results = Transport.deserialize(data);
            return results.list;
        })
        .catch(err => {
            throw err;
        });
    }

    createIndex(path, key, options) {
        const data = JSON.stringify({ action: "create", path, key, options });
        return this._request({ method: "POST", url: `${this.url}/index/${this.dbname}`, data })
        .catch(err => {
            throw err;
        });
    }

    getIndexes() {
        return this._request({ url: `${this.url}/index/${this.dbname}` })
        .catch(err => {
            throw err;
        });         
    }

    reflect(path, type, args) {
        let url = `${this.url}/reflect/${this.dbname}/${path}?type=${type}`;
        if (typeof args === 'object') {
            let query = Object.keys(args).map(key => {
                return `${key}=${args[key]}`;
            });
            if (query.length > 0) {
                url += `&${query.join('&')}`;
            }
        }
        return this._request({ url })
        .catch(err => {
            throw err;
        }); 
    }

    export(path, stream, options = { format: 'json' }) {
        options = options || {};
        options.format = 'json';
        let url = `${this.url}/export/${this.dbname}/${path}?format=${options.format}`;
        return this._request({ url, dataReceivedCallback: chunk => stream.write(chunk) })
        .catch(err => {
            throw err;
        });
    }

    getServerInfo() {
        return this._request({ url: `${this.url}/info/${this.dbname}` }).catch(err => {
            // Prior to acebase-server v0.9.37, info was at /info (no dbname attached)
            this.debug.warn(`Could not get server info, update your acebase server version`);
            return { version: 'unknown', time: Date.now() }
        });
    }
}

module.exports = { WebApi };