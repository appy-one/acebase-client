const { Api, Transport, DebugLogger, ID, PathInfo } = require('acebase-core');
const http = require('http');
const https = require('https');
const URL = require('url');
const connectSocket = require('socket.io-client');

class AceBaseRequestError extends Error {
    constructor(request, response, code, message) {
        super(message);
        this.code = code;
        this.request = request;
        this.response = response;
    }
}

const NOT_CONNECTED_ERROR_MESSAGE = 'remote database is not connected'; //'AceBaseClient is not connected';

const _request = (method, url, postData, accessToken, dataReceivedCallback) => {
    return new Promise((resolve, reject) => {
        let endpoint = URL.parse(url);

        if (typeof postData === 'undefined' || postData === null) {
            postData = '';
        }
        else if (typeof postData === 'object') {
            postData = JSON.stringify(postData);
        }
        const options = {
            method: method,
            protocol: endpoint.protocol,
            host: endpoint.hostname,
            port: endpoint.port,
            path: endpoint.path, //.pathname,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        if (accessToken) {
            options.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        const client = options.protocol === 'https:' ? https : http;
        const req = client.request(options, res => {
            res.setEncoding("utf8");
            let data = '';
            if (typeof dataReceivedCallback === 'function') {
                res.on('data', dataReceivedCallback);
            }
            else {
                res.on('data', chunk => { data += chunk; });
            }
            res.on('end', () => {
                if (res.statusCode === 200) {
                    if (data[0] === '{') {
                        let val = JSON.parse(data);
                        // console.log('Delaying data retrieval...')
                        // setTimeout(() => resolve(val), 2500);
                        resolve(val);
                    }
                    else {
                        resolve(data);
                    }
                }
                else {
                    const request = options;
                    request.body = postData;
                    const response = {
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        body: data
                    };
                    let code = res.statusCode, message = res.statusMessage;
                    if (data[0] == '{') {
                        let err = JSON.parse(data);
                        if (err.code) { code = err.code; }
                        if (err.message) { message = err.message; }
                    }
                    return reject(new AceBaseRequestError(request, response, code, message));
                }
            });
        });

        req.on('error', (err) => {
            reject(new AceBaseRequestError(options, null, err.name, err.message));
        });

        if (postData.length > 0) {
            req.write(postData);
        }
        req.end();
    });
};

const _websocketRequest = (socket, event, data, accessToken) => {

    const requestId = ID.generate();
    const request = data;
    request.req_id = requestId;
    request.access_token = accessToken;

    socket.emit(event, request);

    let resolve, reject;
    let promise = new Promise((res, rej) => { resolve = res; reject = rej; });

    const handle = response => {
        if (response.req_id === requestId) {
            socket.off("result", handle);
            if (response.success) {
                resolve(response);
            }
            else {
                // Access denied?
                // const err = new Error(response.reason.message);
                // err.code = response.reason.code;
                // err.request = request;
                // err.response = response;
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

        this.url = settings.url;
        this._autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this.dbname = dbname;
        this._connected = false;
        this._connecting = false;
        this._cache = settings.cache;
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
                this.debug.warn(`WARNING: The server you are connecting to does not use https, any data transferred may be intercepted!`.red)
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
                                const serverAlreadyNotifying = events.includes(subscr.event);
                                if (!serverAlreadyNotifying) {
                                    events.push(subscr.event);
                                    // this.subscribe(subscr.path, subscr.event, subscr.callback);
                                    const promise = _websocketRequest(this.socket, "subscribe", { path, event: subscr.event }, accessToken);
                                    subscribePromises.push(promise);
                                }
                            });
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
                    let val = Transport.deserialize(data.val);
                    // console.log(`${this._cache ? `[${this._cache.db.api.storage.name}] ` : ''}Received data event "${data.event}" on path "${data.path}":`, val);
                    const pathSubs = subscriptions[data.subscr_path];
                    if (!pathSubs) {
                        // weird. we are not subscribed on this path?
                        this.debug.warn(`Received a data-event on a path we did not subscribe to: "${data.path}"`);
                        return;
                    }
                    let eventsFired = false;
                    if (this._cache) {
                        if (data.event === 'notify_child_removed') {
                            this._cache.db.api.set(`${this.dbname}/cache/${data.path}`, null); // Remove cached value
                            eventsFired = true;
                        }
                        else if (!data.event.startsWith('notify_')) {
                            this._cache.db.api.set(`${this.dbname}/cache/${data.path}`, val.current); // Update cached value
                            eventsFired = true;
                        }
                    }
                    // Only fire events if they were not triggered by the cache db already (and they only fired if the cached data really changed!)
                    !eventsFired && pathSubs.forEach(subscr => {
                        if (subscr.event === data.event) {
                            subscr.callback(null, data.path, val.current, val.previous);
                        }
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
            let serverAlreadyNotifying = pathSubs.some(sub => sub.event === event);
            const subscr = { path, event, callback };
            pathSubs.push(subscr);

            if (this._cache) {
                // Events are also handled by cache db
                subscr.cacheCallback = (err, path, newValue, oldValue) => subscr.callback(err, path.slice(`${this.dbname}/cache/`.length), newValue, oldValue);
                this._cache.db.api.subscribe(`${this.dbname}/cache/${path}`, event, subscr.cacheCallback);
            }

            if (serverAlreadyNotifying || !this._connected) {
                return Promise.resolve();
            }
            return _websocketRequest(this.socket, "subscribe", { path, event }, accessToken);
        };

        this.unsubscribe = (path, event = undefined, callback = undefined) => {
            let pathSubs = subscriptions[path];
            if (!pathSubs) { return; }

            const unsubscribeFrom = (subscriptions) => {
                subscriptions.forEach(subscr => {
                    pathSubs.splice(pathSubs.indexOf(subscr), 1);
                    if (this._cache) {
                        // Events are also handled by cache db, also remove those
                        console.assert(typeof subscr.cacheCallback !== 'undefined', 'When subscription was added, cacheCallback must have been set');
                        this._cache.db.api.unsubscribe(`${this.dbname}/cache/${path}`, subscr.event, subscr.cacheCallback);
                    }
                });
            };

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

            if (pathSubs.length === 0) {
                // Unsubscribed from all events on path
                delete subscriptions[path];
                // socket.emit("unsubscribe", { path, access_token: accessToken });
                if (this._connected) {
                    return _websocketRequest(this.socket, "unsubscribe", { path, access_token: accessToken }, accessToken);
                }
            }
            else if (pathSubs.reduce((c, subscr) => c + (subscr.event === event ? 1 : 0), 0) === 0) {
                // No callbacks left for specific event
                // socket.emit("unsubscribe", { path, event, access_token: accessToken });
                if (this._connected) {
                    return _websocketRequest(this.socket, "unsubscribe", { path: path, event, access_token: accessToken }, accessToken);
                }
            }
            return Promise.resolve();
        };

        this.transaction = (path, callback) => {
            const id = ID.generate();
            const cachePath = `${this.dbname}/cache/${path}`;
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
            let txResolve, txPromise = new Promise((resolve) => {
                txResolve = resolve;
            });
            const completedCallback = (data) => {
                if (data.id === id) {
                    this.socket.off("tx_completed", completedCallback);
                    if (this._cache && typeof cacheUpdateVal !== 'undefined') {
                        // Update cache db value
                        this._cache.db.api.set(cachePath, cacheUpdateVal).then(() => {
                            txResolve(this);
                        })
                    }
                    else {
                        txResolve(this);
                    }
                }
            }
            const connectedCallback = () => {
                this.socket.on("tx_started", startedCallback);
                this.socket.on("tx_completed", completedCallback);
                // TODO: socket.on('disconnect', disconnectedCallback);
                this.socket.emit("transaction", { action: "start", id, path, access_token: accessToken });
            };
            if (this._connected) { 
                connectedCallback(); 
            }
            else { 
                // DISABLED because it is unclear to calling code what we're waiting for:
                // this._connectHooks.push('connect', connectedCallback); 
                return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
            }
            return txPromise;
        };

        /**
         * @param {object} options 
         * @param {string} options.url
         * @param {'GET'|'PUT'|'POST'|'DELETE'} [options.method='GET']
         * @param {any} [options.data] Data to post when method is PUT or POST
         * @param {(chunk: string) => void} [options.dataReceivedCallback] A method that overrides the default data receiving handler. Override for streaming.
         * @param {boolean} [options.ignoreConnectionState=false] Whether to try the request even if there is no connection
         */
        this._request = (options) => {
            if (this._connected || options.ignoreConnectionState === true) { 
                return _request(options.method || 'GET', options.url, options.data, accessToken, options.dataReceivedCallback)
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

    sync(eventCallback) {
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

        eventCallback && eventCallback('sync_start');
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
                                promise = this.update(change.path, change.data, { allow_cache: false });
                            }
                            else if (change.type === 'set') { 
                                if (!change.data) { change.data = null; } // Before type 'remove' was implemented
                                promise = this.set(change.path, change.data, { allow_cache: false });
                            }
                            else if (change.type === 'remove') {
                                promise = this.set(change.path, null, { allow_cache: false });
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
                                cacheApi.set(`${this.dbname}/cache/${change.data.path}`, null);
                                eventCallback && eventCallback('sync_change_error', { error: err, change });
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
            if (this._cache) {
                // Find out what data to load
                const loadPaths = Object.keys(this._subscriptions).reduce((paths, path) => {
                    const hasValueSubscribers = this._subscriptions[path].some(s => !s.event.startsWith('notify_'));
                    if (hasValueSubscribers) {
                        const pathInfo = PathInfo.get(path);
                        const ancestorIncluded = paths.some(otherPath => pathInfo.isDescendantOf(otherPath));
                        if (!ancestorIncluded) { paths.push(path); }
                    }
                    return paths;
                }, []);
                // Attach temp events to cache db so they will fire for data changes
                Object.keys(this._subscriptions).forEach(path => {
                    this._subscriptions[path].forEach(subscr => {
                        subscr.tempCallback = (err, path, newValue, oldValue) => {
                            totalRemoteChanges++;
                        }
                        cacheApi.subscribe(`${this.dbname}/cache/${subscr.path}`, subscr.event, subscr.tempCallback);
                    });
                });
                // Fetch new data
                const syncPullPromises = loadPaths.map(path => {
                    this.debug.verbose(`SYNC pull "${path}"`);
                    return this.get(path, { allow_cache: false })
                    .catch(err => {
                        this.debug.error(`SYNC pull error`, err);
                        eventCallback && eventCallback('sync_pull_error', err);
                    });
                });
                return Promise.all(syncPullPromises)
                .then(() => {
                    // Unsubscribe temp cache subscriptions
                    Object.keys(this._subscriptions).forEach(path => {
                        this._subscriptions[path].forEach(subscr => {
                            cacheApi.unsubscribe(`${this.dbname}/cache/${subscr.path}`, subscr.event, subscr.tempCallback);
                            delete subscr.tempCallback;
                        });
                    });
                });
            }
            else {
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
            eventCallback && eventCallback('sync_done', info);
            return info;
        })
        .catch(err => {
            this.debug.error(`SYNC error`, err);
            eventCallback && eventCallback('sync_error', err);
            throw err;
        });
    }

    set(path, value, options = { allow_cache: true }) {
        const useCache = this._cache && options && options.allow_cache === true;
        const updateServer = () => {
            const data = JSON.stringify(Transport.serialize(value));
            return this._request({ method: "PUT", url: `${this.url}/data/${this.dbname}/${path}`, data })
        };
        if (!useCache) {
            return updateServer();
        }

        let rollbackValue;
        const updateCache = () => {
            return this._cache.db.api.transaction( `${this.dbname}/cache/${path}`, (currentValue) => {
                rollbackValue = currentValue;
                return value;
            });
        };
        const rollbackCache = () => {
            return this._cache.db.api.set(`${this.dbname}/cache/${path}`, rollbackValue);
        };

        const addPendingTransaction = () => {
            const id = ID.generate(); 
            return this._cache.db.api.set(`${this.dbname}/pending/${id}`, { type: 'set', path, data: value });
        };

        const cachePromise = updateCache()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        const serverPromise = !this._connected ? null : updateServer()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        Promise.all([ cachePromise, serverPromise ])
        .then(([ cacheResult, serverResult ]) => {
            if (serverPromise) {
                // Server was being updated

                if (serverResult.success) {
                    // Server update success
                    if (!cacheResult.success) { 
                        // Cache update failed for some reason, remove the cached node?
                        this.debug.error(`Failed to set cache for "${path}". Error: `, cacheResult.error);
                        // NOT doing this because that would trigger data events such as "child_removed", "value" etc
                        // deleteCache().catch(err => {
                        //     this.debug.error(`Failed to remove cache for "${path}": `, err);
                        // });
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

        // Use optimistic approach - return cache promise
        return cachePromise;
    }

    update(path, updates, options = { allow_cache: true }) {
        const useCache = this._cache && options && options.allow_cache === true;
        const updateServer = () => {
            const data = JSON.stringify(Transport.serialize(updates));
            return this._request({ method: "POST", url: `${this.url}/data/${this.dbname}/${path}`, data });
        }
        if (!useCache) {
            return updateServer();
        }

        let rollbackUpdates;
        const updateCache = () => {
            const cachePath = `${this.dbname}/cache/${path}`;
            const properties = Object.keys(updates);
            const cacheApi = this._cache.db.api;
            return cacheApi.get(cachePath, { include: properties })
            .then(currentValues=> {
                rollbackUpdates = currentValues;
                return cacheApi.update(cachePath, updates);
            });
        };
        // const deleteCache = () => {
        //     return this._cache.db.api.set(`${this.dbname}/cache/${path}`, null);
        // };
        const rollbackCache = () => {
            return this._cache.db.api.update(`${this.dbname}/cache/${path}`, rollbackUpdates);
        };

        const addPendingTransaction = () => {
            const id = ID.generate(); 
            return this._cache.db.api.set(`${this.dbname}/pending/${id}`, { type: 'update', path, data: updates });
        };

        const cachePromise = updateCache()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        const serverPromise = !this._connected ? null : updateServer()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        Promise.all([ cachePromise, serverPromise ])
        .then(([ cacheResult, serverResult ]) => {
            if (serverPromise) {
                // Server was being updated

                if (serverResult.success) {
                    // Server update success
                    if (!cacheResult.success) { 
                        // Cache update failed for some reason, remove the cached node?
                        this.debug.error(`Failed to update cache for "${path}". Error: `, err);
                        // NOT doing this because that would trigger data events such as "child_removed", "value" etc
                        // deleteCache().catch(err => {
                        //     this.debug.error(`Failed to remove cache for "${path}": `, err);
                        // });
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

        // Use optimistic approach - return cache promise
        return cachePromise;
    }

    get(path, options = { allow_cache: true }) {
        const useCache = this._cache && options && options.allow_cache === true;
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
                        const cachePath = `${this.dbname}/cache/${path}`;
                        return this._cache.db.api.set(cachePath, val)
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
            return this._cache.db.api.get(`${this.dbname}/cache/${path}`, options);
        };

        if (!useCache) {
            return getServerValue();
        }
        else if (!this._connected) {
            return getCacheValue();
        }
        else {
            // Get both, use cached value if available and server version takes too long
            return new Promise((resolve, reject) => {
                let wait = true, done = false;
                const gotValue = (source, val) => {
                    if (done) { return; }
                    if (source === 'server') {
                        done = true;
                        console.log(`Using server value for "${path}"`);
                        resolve(val);
                    }
                    else if (!wait) { 
                        // Cached results, don't wait for server value
                        done = true; 
                        console.log(`Using cache value for "${path}"`);
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
                        reject(errors.find(e => e.source === 'server'));
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
        const useCache = this._cache && options && options.allow_cache === true;
        const getCacheExists = () => {
            return this._cache.db.api.exists(`${this.dbname}/cache/${path}`);
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
            return this._cache.db.api.query(`${this.dbname}/cache/${path}`, query, options);
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
}

module.exports = { WebApi };