const { Api, Transport, ID, PathInfo, ColorStyle, SchemaDefinition } = require('acebase-core');
const connectSocket = require('socket.io-client');
const Base64 = require('./base64');
const { AceBaseRequestError, NOT_CONNECTED_ERROR_MESSAGE } = require('./request/error');
const { promiseTimeout } = require('./promise-timeout');
const _request = require('./request');
const _websocketRequest = (socket, event, data, accessToken) => {

    const requestId = ID.generate();
    const request = data;
    request.req_id = requestId;
    request.access_token = accessToken;

    return new Promise((resolve, reject) => { 
        let timeout;
        const send = (retry = 0) => { 
            socket.emit(event, request);
            timeout = setTimeout(() => {
                if (retry < 2) { return send(retry+1); }
                socket.off("result", handle);
                const err = new AceBaseRequestError(request, null, 'timeout', `Server did not respond to "${event}" request after ${retry+1} tries`);
                reject(err);
            }, 1000);
        };
        const handle = response => {
            if (response.req_id === requestId) {
                clearTimeout(timeout);
                socket.off("result", handle);
                if (response.success) {
                    return resolve(response);
                }
                // Access denied?
                const code = typeof response.reason === 'object' ? response.reason.code : response.reason;
                const message = typeof response.reason === 'object' ? response.reason.message : `request failed: ${code}`;
                const err = new AceBaseRequestError(request, response, code, message);
                reject(err);
            }
        }
        socket.on("result", handle);
        send();
    });
}

/**
 * @typedef {((err: Error, path:string, newValue:any, oldValue:any, context: any) => any)} EventSubscriptionCallback
 * @typedef {{ newOnly: boolean, cancelCallback: (reason: Error) => any, syncFallback: 'reload'|(() => any|Promise<any>)}} EventSubscriptionSettings
 */

class EventSubscription {
    /**
     * 
     * @param {string} path 
     * @param {string} event 
     * @param {EventSubscriptionCallback} callback 
     * @param {EventSubscriptionSettings} settings 
     */
    constructor(path, event, callback, settings) {
        /** @type {string} */this.path = path;
        /** @type {string} */this.event = event;
        /** @type {EventSubscriptionCallback}*/this.callback = callback;
        /** @type {EventSubscriptionSettings} */this.settings = settings;
        /** @type {'requested'|'active'|'canceled'} */this.state = 'requested';
        /** @type {number} */this.added = Date.now();
        /** @type {number} */this.activated = 0;
        /** @type {number} */this.lastEvent = 0;
        /** @type {number} */this.lastSynced = 0;
        /** @type {string} */this.cursor = null;
        /** @type {EventSubscriptionCallback}*/this.cacheCallback = null;
        /** @type {EventSubscriptionCallback}*/this.tempCallback = null;
    }
    activate() {
        this.state = 'active';
        if (this.activated === 0) {
            this.activated = Date.now();
        }
    }
    cancel(reason) {
        this.state = 'canceled';
        this.settings.cancelCallback(reason);
    }
}

const CONNECTION_STATE_DISCONNECTED = 'disconnected';
const CONNECTION_STATE_CONNECTING = 'connecting';
const CONNECTION_STATE_CONNECTED = 'connected';
const CONNECTION_STATE_DISCONNECTING = 'disconnecting';

/**
 * Api to connect to a remote AceBase server over http(s)
 */
class WebApi extends Api {

    /**
     * 
     * @param {string} dbname 
     * @param {{ logLevel: 'verbose'|'log'|'warn'|'error', debug: object, url: string, autoConnect: boolean, autoConnectDelay: number, cache: object }} settings 
     * @param {(event: string, ...args: any[]) => void} callback 
     */
    constructor(dbname = "default", settings, callback) {
        // operations are done through http calls,
        // events are triggered through a websocket
        super();

        this._id = ID.generate(); // For mutation contexts, not using websocket client id because that might cause security issues
        this.url = settings.url;
        this._autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this._autoConnectDelay = typeof settings.autoConnectDelay === 'number' ? settings.autoConnectDelay : 0;
        this.dbname = dbname;
        this._connectionState = CONNECTION_STATE_DISCONNECTED;
        this._cursor = {
            /** Last cursor received by the server */
            current: null,
            /** Last cursor received before client went offline, will be used for sync. */
            sync: null
        };
        this._updateCursor = async cursor => {
            if (!cursor || (this._cursor.current && cursor < this._cursor.current)) {
                return; // Just in case this ever happens, ignore events with earlier cursors.
            }
            // console.log(`Updating sync cursor to ${cursor}`);
            this._cursor.current = cursor;
            // if (this._cache && this._cache.db) {
            //     await this._cache.db.api.set(`${this.dbname}/cursor`, cursor)
            //     .catch(err => {
            //         console.error(`Can't store cursor?`, err);
            //     });
            // }
        };
        this._eventTimeline = { init: Date.now(), connect: 0, signIn: 0, sync: 0, disconnect: 0 };
        if (settings.cache && settings.cache.enabled !== false) {
            this._cache = {
                db: settings.cache.db,
                priority: settings.cache.priority || 'server'
            };
            // this._cache.db.api.get(`${this.dbname}/cursor`).then(({ value: cursor }) => {
            //     this._syncCursor = cursor;
            // });
        }
        this._realtimeQueries = {};
        this.debug = settings.debug;
        const eventCallback = (event, ...args) => {
            if (event === 'disconnect') {
                this._cursor.sync = this._cursor.current;
            }
            callback && callback(event, ...args);
        };
        /** @type {{ [path: string]: EventSubscription[] }} */
        let subscriptions = this._subscriptions = {};
        let accessToken;

        this.connect = () => {            
            if (this.socket !== null && typeof this.socket === 'object') {
                this.disconnect();
            }
            this._connectionState = CONNECTION_STATE_CONNECTING;
            this.debug.log(`Connecting to AceBase server "${this.url}"`);
            if (!this.url.startsWith('https')) {
                this.debug.warn(`WARNING: The server you are connecting to does not use https, any data transferred may be intercepted!`.colorize(ColorStyle.red));
            }
    
            return new Promise((resolve, reject) => {
                const socket = this.socket = connectSocket(this.url, {
                    // Use default socket.io connection settings:
                    autoConnect: true,
                    reconnection: true,
                    reconnectionAttempts: Infinity,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    timeout: 20000,
                    randomizationFactor: 0.5
                });

                socket.on('connect_error', err => {
                    // New connection failed to establish. Attempts will be made to reconnect, but fail for now
                    this.debug.error(`Websocket connection error: ${err}`);
                    eventCallback('connect_error', err);
                    reject(err);
                });

                socket.on('connect', async data => {
                    this._connectionState = CONNECTION_STATE_CONNECTED;
                    this._eventTimeline.connect = Date.now();

                    if (accessToken) {
                        // User must be signed in again (NOTE: this does not emit the "signin" event if the user was signed in before)
                        const isFirstSignIn = this._eventTimeline.signIn === 0;
                        try {
                            await this.signInWithToken(accessToken, isFirstSignIn);
                        }
                        catch(err) {
                            this.debug.error(`Could not automatically sign in user with access token upon reconnect: ${err.code || err.message}`);
                        }
                    }

                    /**
                     * @param {EventSubscription} sub
                     * @returns {Promise<void>}
                     */
                    const subscribeTo = async (sub) => {
                        // Function is called for each unique path/event combination
                        // We must activate or cancel all subscriptions with this combination
                        const subs = subscriptions[sub.path].filter(s => s.event === sub.event);
                        try {
                            const result = await _websocketRequest(this.socket, 'subscribe', { path: sub.path, event: sub.event }, accessToken);
                            subs.forEach(s => s.activate());
                        }
                        catch(err) {
                            if (err.code === 'access_denied' && !accessToken) {
                                this.debug.error(`Could not subscribe to event "${sub.event}" on path "${sub.path}" because you are not signed in. If you added this event while offline and have a user access token, you can prevent this by using client.auth.setAccessToken(token) to automatically try signing in after connecting`);
                            }
                            else {
                                this.debug.error(err);
                            }
                            subs.forEach(s => s.cancel(err));
                        }
                    };

                    // (re)subscribe to any active subscriptions
                    const subscribePromises = [];
                    Object.keys(subscriptions).forEach(path => {
                        const events = [];
                        subscriptions[path].forEach(sub => {
                            if (sub.event === 'mutated') { return; } // Skip mutated events for now
                            const serverAlreadyNotifying = events.includes(sub.event);
                            if (!serverAlreadyNotifying) {
                                events.push(sub.event);
                                const promise = subscribeTo(sub);
                                subscribePromises.push(promise);
                            }
                        });
                    });

                    // Now, subscribe to all top path mutated events
                    const subscribeToMutatedEvents = async () => {
                        let retry = false;
                        let promises = Object.keys(subscriptions)
                            .filter(path => subscriptions[path].some(sub => sub.event === 'mutated' && sub.state !== 'canceled'))
                            .filter((path, i, arr) => !arr.some(otherPath => PathInfo.get(otherPath).isAncestorOf(path)))
                            .reduce((topPaths, path) => (topPaths.includes(path) || topPaths.push(path)) && topPaths, [])
                            .map(topEventPath => {
                                const sub = subscriptions[topEventPath].find(s => s.event === 'mutated');
                                promise = subscribeTo(sub).then(() => {
                                    if (sub.state === 'canceled') {
                                        // Oops, could not subscribe to 'mutated' event on topEventPath, other event(s) at child path(s) should now take over
                                        retry = true;
                                    }
                                });
                                promises.push(promise);
                            });
                        await Promise.all(promises);
                        if (retry) {
                            return subscribeToMutatedEvents();
                        }
                    }
                    subscribePromises.push(subscribeToMutatedEvents());
                    await Promise.all(subscribePromises);

                    eventCallback('connect'); // Safe to let client know we're connected
                    resolve(); // Resolve the .connect() promise
                });

                socket.on('disconnect', reason => {
                    // Existing connection was broken, by us or network
                    if (this._connectionState === CONNECTION_STATE_DISCONNECTING) {
                        // disconnect was requested by us: reason === 'client namespace disconnect'
                        this._connectionState = CONNECTION_STATE_DISCONNECTED;
                    }
                    else {
                        // Automatic reconnect should be done by socket.io
                        this._connectionState = CONNECTION_STATE_CONNECTING;
                        this._eventTimeline.disconnect = Date.now();
                    }
                    eventCallback('disconnect');
                });

                socket.on('data-event', data => {
                    const val = Transport.deserialize(data.val);
                    const context = data.context || {};
                    context.acebase_event_source = 'server';
                    this._updateCursor(context.acebase_cursor); // If the server passes a cursor, it supports transaction logging. Save it for sync later on

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
                        cross-tab communication has been implemented. (TODO: let cache db's use the same client 
                        ID for server communications)
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
                    // The cache db will not have fired any events (const fireCacheEvents = false), so we can fire them here now.
                    /** @type {EventSubscription[]} */
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
                    
                    targetSubs.forEach(subscr => {
                        subscr.lastEvent = Date.now();
                        subscr.cursor = context.acebase_cursor;
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
            if (this._autoConnectDelay) { setTimeout(() => this.connect().catch(() => {}), this._autoConnectDelay); }
            else { this.connect().catch(() => {}); }
        }

        this.disconnect = () => {
            if (this.socket !== null && typeof this.socket === 'object') {
                this._connectionState = CONNECTION_STATE_DISCONNECTING;
                this._eventTimeline.disconnect = Date.now();
                this.socket.disconnect();
                this.socket = null;
            }
        };

        /**
         * 
         * @param {string} path 
         * @param {string} event 
         * @param {function} callback 
         * @param {EventSubscriptionSettings} settings 
         * @returns 
         */
        this.subscribe = async (path, event, callback, settings) => {
            let pathSubs = subscriptions[path];
            if (!pathSubs) { pathSubs = subscriptions[path] = []; }
            let serverAlreadyNotifying = pathSubs.some(sub => sub.event === event)
                || (event === 'mutated' && Object.keys(subscriptions).some(otherPath => PathInfo.get(otherPath).isAncestorOf(path) && subscriptions[otherPath].some(sub => sub.event === event && sub.state === 'active')));
            const subscr = new EventSubscription(path, event, callback, settings);
            // { path, event, callback, settings, added: Date.now(), activate() { this.activated = Date.now() }, activated: null, lastEvent: null, cursor: null };
            pathSubs.push(subscr);

            if (this._cache) {
                // Events are also handled by cache db
                subscr.cacheCallback = (err, path, newValue, oldValue, context) => subscr.callback(err, path.slice(`${this.dbname}/cache/`.length), newValue, oldValue, context);
                this._cache.db.api.subscribe(PathInfo.getChildPath(`${this.dbname}/cache`, path), event, subscr.cacheCallback);
            }

            if (serverAlreadyNotifying || !this.isConnected) { 
                // If we're offline, the event will be subscribed once connected
                return;
            }
            if (event === 'mutated') {
                // Unsubscribe from 'mutated' events set on descendant paths of current path
                Object.keys(subscriptions)
                .filter(otherPath => 
                    PathInfo.get(otherPath).isDescendantOf(path) 
                    && subscriptions[otherPath].some(sub => sub.event === 'mutated')
                )
                .map(path => _websocketRequest(this.socket, 'unsubscribe', { path, event: 'mutated' }, accessToken))
                .map(promise => promise.catch(err => console.error(err)))
            }
            const result = await _websocketRequest(this.socket, 'subscribe', { path, event }, accessToken);
            subscr.activate();
            return result;
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
                if (this.isConnected) {
                    promise = _websocketRequest(this.socket, 'unsubscribe', { path, access_token: accessToken }, accessToken)
                        .catch(err => this.debug.error(`Failed to unsubscribe from event(s) on "${path}": ${err.message}`));
                }
            }
            else if (this.isConnected && !pathSubs.some(subscr => subscr.event === event)) {
                // No callbacks left for specific event
                promise = _websocketRequest(this.socket, 'unsubscribe', { path: path, event, access_token: accessToken }, accessToken)
                    .catch(err => this.debug.error(`Failed to unsubscribe from event "${event}" on "${path}": ${err.message}`));
            }
            if (this.isConnected && hadMutatedEvents && !hasMutatedEvents) {
                // If any descendant paths have mutated events, resubscribe those
                const promises = Object.keys(subscriptions)
                    .filter(otherPath => PathInfo.get(otherPath).isDescendantOf(path) && subscriptions[otherPath].some(sub => sub.event === 'mutated'))
                    .map(path => _websocketRequest(this.socket, 'subscribe', { path: path, event: 'mutated' }, accessToken))
                    .map(promise => promise.catch(err => this.debug.error(`Failed to subscribe to event "${event}" on path "${path}": ${err.message}`)));
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
            };
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
            if (this.isConnected) { 
                connectedCallback(); 
            }
            else { 
                // Websocket might not be connected. Try http call instead
                const data = JSON.stringify({ path });
                this._request({ ignoreConnectionState: true, method: 'POST', url: `${this.url}/transaction/${this.dbname}/start`, data, context: options.context })
                .then(tx => {
                    const id = tx.id;
                    const currentValue = Transport.deserialize(tx.value);
                    const value = callback(currentValue);
                    const data = JSON.stringify({ id, value: Transport.serialize(value) });
                    return this._request({ ignoreConnectionState: true, method: 'POST', url: `${this.url}/transaction/${this.dbname}/finish`, data, context: options.context })
                })
                .catch(err => {
                    if (['ETIMEDOUT','ENOTFOUND','ECONNRESET','ECONNREFUSED','EPIPE', 'fetch_failed'].includes(err.code)) {
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
         * @param {boolean} [options.includeContext=false] NEW Whether the returned object should contain an optionally returned context object.
         * @returns {Promise<any|{ context: any, data: any }>} returns a promise that resolves with the returned data, or (when options.includeContext === true) an object containing data and returned context
         */
        this._request = async (options) => {
            if (this.isConnected || options.ignoreConnectionState === true) {
                const result = await _request(options.method || 'GET', options.url, { data: options.data, accessToken, dataReceivedCallback: options.dataReceivedCallback, context: options.context });
                if (result.context && result.context.acebase_cursor) {
                    this._updateCursor(result.context.acebase_cursor);
                }
                if (options.includeContext === true) {
                    if (!result.context) { result.context = {}; }
                    return result;
                }
                else {
                    return result.data;
                }
            }
            else {
                // We're not connected. We can wait for the connection to be established,
                // or fail the request now. Because we have now implemented caching, live requests
                // are only executed if they are not allowed to use cached responses. Wait for a
                // connection to be established (max 1s), then retry or fail

                if (!this.isConnecting) {
                    // We're currently not trying to connect. Fail now
                    throw new Error(NOT_CONNECTED_ERROR_MESSAGE);
                }

                const connectPromise = new Promise(resolve => this.socket.once('connect', resolve));
                await promiseTimeout(connectPromise, 1000, 'Waiting for connection').catch(err => {
                    throw new Error(NOT_CONNECTED_ERROR_MESSAGE);
                });
                return this._request(options); // Retry
            }
        };

        const handleSignInResult = (result, emitEvent = true) => {
            this._eventTimeline.signIn = Date.now();
            const details = { user: result.user, accessToken: result.access_token, provider: result.provider || 'acebase' };
            accessToken = details.accessToken;
            this.socket.emit('signin', details.accessToken);  // Make sure the connected websocket server knows who we are as well.
            emitEvent && eventCallback('signin', details);
            return details;
        }

        this.signIn = async (username, password) => {
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'account', username, password, client_id: this.socket.id } });
            return handleSignInResult(result);
        };

        this.signInWithEmail = async (email, password) => {
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'email', email, password, client_id: this.socket.id } });
            return handleSignInResult(result);
        };

        this.signInWithToken = async (token, emitEvent = true) => {
            if (!this.isConnected) { 
                throw new Error('Cannot sign in because client is not connected to the server. If you want to automatically sign in the user with this access token once a connection is established, use client.auth.setAccessToken(token)'); 
            }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'token', access_token: token, client_id: this.socket.id } });
            return handleSignInResult(result, emitEvent);
        };

        this.setAccessToken = (token) => {
            accessToken = token;
        };

        this.startAuthProviderSignIn = async (providerName, callbackUrl, options) => {
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const optionParams = options && typeof options === 'object' && '&' + Object.keys(options).map(key => `option_${key}=${encodeURIComponent(options[key])}`).join('&');
            const result = await this._request({ url: `${this.url}/oauth2/${this.dbname}/init?provider=${providerName}&callbackUrl=${callbackUrl}${optionParams}` });
            return { redirectUrl: result.redirectUrl };
        };

        this.finishAuthProviderSignIn = async (callbackResult) => {
            /** @type {{ provider: { name: string, access_token: string, refresh_token: string, expires_in: number }, access_token: string, user: AceBaseUser }} */
            let result;
            try {
                result = JSON.parse(Base64.decode(callbackResult));
                // TODO: Implement server check
            }
            catch (err) {
                throw new Error(`Invalid result`);
            }
            return handleSignInResult(result);
        };

        this.refreshAuthProviderToken = async (providerName, refreshToken) => {
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            return this._request({ url: `${this.url}/oauth2/${this.dbname}/refresh?provider=${providerName}&refresh_token=${refreshToken}` });
        };

        this.signOut = async (options = { everywhere: false, clearCache: false }) => {
            if (typeof options === 'boolean') {
                // Old signature signOut(everywhere:boolean = false)
                options = { everywhere: options };
            }
            else if (typeof options !== 'object') {
                throw new TypeError('options must be an object');
            }
            if (typeof options.everywhere !== 'boolean') { options.everywhere = false; }
            if (typeof options.clearCache !== 'boolean') { options.clearCache = false; }

            if (!accessToken) { return; }
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/signout`, data: { client_id: this.socket.id, everywhere: options.everywhere } });
            this.socket.emit('signout', accessToken); // Make sure the connected websocket server knows we signed out as well. 
            accessToken = null;
            if (this._cache && options.clearCache) {
                // Clear cache, but don't wait for it to finish
                this.clearCache().catch(err => {
                    console.error(`Could not clear cache:`, err);
                });
            }
            eventCallback('signout');
        };

        this.changePassword = async (uid, currentPassword, newPassword) => {
            if (!accessToken) { throw new Error(`not_signed_in`); }
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/change_password`, data: { uid, password: currentPassword, new_password: newPassword } });
            accessToken = result.access_token;
            return { accessToken };
        };
    
        this.forgotPassword = async (email) => {
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/forgot_password`, data: { email } });
            return result;
        };

        this.verifyEmailAddress = async (verificationCode) => {
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/verify_email`, data: { code: verificationCode } });
            return result;
        };

        this.resetPassword = async (resetCode, newPassword) => {
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/reset_password`, data: { code: resetCode, password: newPassword } })
            return result;
        };

        this.signUp = async (details, signIn = true) => {
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/signup`, data: details });
            if (signIn) {
                return handleSignInResult(result);
            }
            return { user: result.user, accessToken };
        };

        this.updateUserDetails = async (details) => {
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/update`, data: details });
            return { user: result.user };
        };

        this.deleteAccount = async (uid, signOut = true) => {
            if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
            const result = await this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/delete`, data: { uid } });
            if (signOut) {
                this.socket.emit('signout', accessToken);
                accessToken = null;
                eventCallback('signout');
            }
            return true;
        };
    }

    get isConnected() {
        return this._connectionState === CONNECTION_STATE_CONNECTED;
    }
    get isConnecting() {
        return this._connectionState === CONNECTION_STATE_CONNECTING;
    }

    stats(options = undefined) {
        return this._request({ url: `${this.url}/stats/${this.dbname}` });
    }

    async sync(options = { firstSync: false, fetchFreshData: true, eventCallback: null }) {
        // Sync cache
        if (!this.isConnected) { throw new Error(NOT_CONNECTED_ERROR_MESSAGE); }
        if (this._cache && !this._cache.db.isReady) {
            throw new Error(`cache database is not ready yet`);
        }

        this._eventTimeline.sync = Date.now();
        options.eventCallback && options.eventCallback('sync_start');
        const handleStatsUpdateError = err => {
            this.debug.error(`Failed to update cache db stats:`, err);
        };

        try {
            let totalPendingChanges = 0;
            const cursor = this._cursor.sync;
            const cacheApi = this._cache && this._cache.db.api;
            if (this._cache) {
                // Part 1: PUSH local changes
                const { value: pendingChanges, context } = await cacheApi.get(`${this.dbname}/pending`);
                cacheApi.set(`${this.dbname}/stats/last_sync_start`, new Date()).catch(handleStatsUpdateError);
                try {
                    // Merge mutations to multiple properties into single updates (again)
                    // This prevents single property updates failing because of schema restrictions
                    // Eg:
                    // 1. set users/ewout/name: 'Ewout'
                    // 2. set users/ewout/address: { street: 'My street', nr: 1 }
                    // 3. remove users/ewout/age
                    // 4. remove users/ewout/address/street
                    // --> should merge into:
                    // 1. update users/ewout: { name: 'Ewout', address: { street: 'My street', nr: 1 }, age: null }
                    // 4. remove users/ewout/address/street (does not attempt to merge with nested properties of previous updates)

                    const ids = Object.keys(pendingChanges || {}).sort(); // sort a-z, process oldest mutation first
                    const compatibilityMode = ids.map(id => pendingChanges[id]).some(m => m.type === 'update');
                    const mutations = compatibilityMode
                        ? ids.map(id => {
                            // If any "update" mutations are in the db, these are old mutations. Process them unaltered. This is for backward compatibility only, can be removed later. (if code was able to update, mutations could have already been synced too, right?)
                            const mutation = pendingChanges[id];
                            mutation.id = id;
                            return mutation;
                        })
                        : ids.reduce((mutations, id) => {
                            const change = pendingChanges[id];
                            console.assert(['set', 'remove'].includes(change.type), 'Only "set" and "remove" mutations should be present');
                            if (change.path === '') {
                                // 'set' on the root path - can't turn this into an update on the parent.

                                // With new approach, there should be no previous 'set' or 'remove' mutation on any node because they 
                                // have been removed by _addCacheSetMutation. But... if there are old mutations in the db 
                                // without 'update' mutations (because then we'd have been in compatibilityMode above) - we'll filter
                                // them out here. In the future we could just add this change without checking, but code below doesn't
                                // harm the process, so it's ok to stay.
                                const rootUpdate = mutations.find(u => u.path === '');
                                if (rootUpdate) { rootUpdate.data = change.data; }
                                else { change.id = id; mutations.push(change); }
                            }
                            else {
                                const pathInfo = PathInfo.get(change.path);
                                const parentPath = pathInfo.parentPath;
                                const parentUpdate = mutations.find(u => u.path === parentPath);
                                const value =  change.type === 'remove' || change.data === null || typeof change.data === 'undefined' ? null : change.data;
                                if (!parentUpdate) {
                                    // Create new parent update
                                    // change.context.acebase_sync = { }; // TODO: Think about what context we could add to let receivers know why this merged update happens
                                    mutations.push({ id, type: 'update', path: parentPath, data: { [pathInfo.key]: value }, context: change.context });
                                }
                                else {
                                    // Add this change to parent update
                                    parentUpdate.data[pathInfo.key] = value;
                                }
                            }
                            return mutations;
                        }, []);

                    for (let m of mutations) {
                        const id = m.id;
                        this.debug.verbose(`SYNC pushing mutation ${id}: `, m);
                        totalPendingChanges++;

                        try {
                            if (m.type === 'update') {
                                await this.update(m.path, m.data, { allow_cache: false, context: m.context });
                            }
                            else if (m.type === 'set') {
                                if (!m.data) { m.data = null; } // Before type 'remove' was implemented
                                await this.set(m.path, m.data, { allow_cache: false, context: m.context });
                            }
                            else if (m.type === 'remove') {
                                await this.set(m.path, null, { allow_cache: false, context: m.context });
                            }
                            else {
                                throw new Error(`unsupported mutation type "${m.type}"`);
                            }
                            this.debug.verbose(`SYNC mutation ${id} processed ok`);

                            cacheApi.set(`${this.dbname}/pending/${id}`, null); // delete from cache db
                        }
                        catch(err) {
                            // Updating remote db failed
                            this.debug.error(`SYNC mutation ${id} failed: ${err.message}`);
                            if (!this.isConnected) {
                                // Connection was broken, should retry later
                                throw err;
                            }
                            // We are connected, so the mutation is not allowed or otherwise denied.
                            if (typeof err === 'string') { 
                                err = { code: 'unknown', message: err, stack: 'n/a' }; 
                            }

                            // Store error report
                            const errorReport = { date: new Date(), code: err.code || 'unknown', message: err.message, stack: err.stack };
                            cacheApi.transaction(`${this.dbname}/pending/${id}`, m => {
                                if (!m.error) {
                                    m.error = {
                                        first: errorReport, 
                                        last: errorReport,
                                        retries: 0
                                    };
                                }
                                else {
                                    m.error.last = errorReport;
                                    m.error.retries++;
                                }
                                if (m.error.retries === 3) {
                                    // After 3 failed retries, move to /dbname/failed/id
                                    cacheApi.set(`${this.dbname}/failed/${id}`, m);
                                    return null; // remove pending
                                }
                                return m;
                            });
                            cacheApi.set(`${this.dbname}/stats/last_sync_error`, errorReport).catch(handleStatsUpdateError);
                            // TODO: Send error report to server?
                            // this.reportError({ code: 'sync-mutation', report: errorReport });

                            options.eventCallback && options.eventCallback('sync_change_error', { error: err, change: m });
                        }
                    }

                    this.debug.verbose(`SYNC push done`);

                    // Update stats
                    cacheApi.set(`${this.dbname}/stats/last_sync_end`, new Date()).catch(handleStatsUpdateError);
                }
                catch(err) {
                    // 1 or more pending changes could not be processed.
                    this.debug.error(`SYNC push error: ${err.message}`);
                    if (typeof err === 'string') { 
                        err = { code: 'unknown', message: err, stack: 'n/a' }; 
                    }
                    cacheApi.set(`${this.dbname}/stats/last_sync_error`, { date: new Date(), code: err.code || 'unknown', message: err.message, stack: err.stack }).catch(handleStatsUpdateError);
                    throw err;
                }
            }

            // We've pushed our changes, now get fresh data for all paths with active subscriptions

            // Using a cursor we can get changes since disconnect
            // - If we have a cursor, we were connected before. 
            // - A cursor can only be used for events added while connected, not for events added while offline
            // - A cursor can currently only be used if a cache db is used.
            // - If there is no cursor because there were no events fired during a previous connection, use disconnected logic for all events
            // 
            //  -------------------------------------------------------------
            // |                 |           event subscribe time           |
            // |     event       |  pre-connect | connected | disconnected  |
            // |------------------------------------------------------------|
            // | value           |     get      |   cursor  |     get       |
            // | child_added     |     get*     |   cursor  |     get*      |
            // | child_removed   |     warn     |   cursor  |     warn      |
            // | child_changed   |     warn     |   cursor  |     warn      |
            // | mutated         |     warn     |   cursor  |     warn      |
            // | mutations       |     warn     |   cursor  |     warn      |
            // | notify_*        |     warn     |   warn    |     warn      |
            // --------------------------------------------------------------
            // * only if sub.newOnly === false, warn otherwise
            // --------------------------------------------------------------

            let totalRemoteChanges = 0, usedSyncMethod = 'reload';
            const subscriptionPaths = Object.keys(this._subscriptions);
            const subscriptions = subscriptionPaths.reduce((subs, path) => {
                this._subscriptions[path].forEach(sub => subs.push(sub));
                return subs;
            }, []);
            subscriptions.for = function(path) {
                return this.filter(sub => sub.path === path);
            };

            if (this._cache) { //  && options.fetchFreshData
                // Part 2: PULL remote changes / fresh data

                // Attach temp events to cache db so they will fire for data changes (just for counting)
                subscriptions.forEach(sub => {
                    sub.tempCallback = (err, path, newValue, oldValue, context) => {
                        totalRemoteChanges++;
                    }
                    cacheApi.subscribe(PathInfo.getChildPath(`${this.dbname}/cache`, sub.path), sub.event, sub.tempCallback);
                });

                let strategy = {
                    /** @type {string[]} Data paths to reload */
                    reload: [],
                    /** @type {Array<{path: string, events: string[]}>} Event targets to fetch changes with cursor */
                    cursor: [],
                    /** @type {Array<EventSubscription>} Subscriptions that have custom sync fallback logic, used when there is no automated way to synchronize */
                    fallback: [],
                    /** @type {Array<{path: string, events: string[]}>} Event targets to warn about */
                    warn: [],
                    /** @type {Array<EventSubscription>} Subscriptions that require no action because they were added after last connect event */
                    noop: []
                };
                // const wasAddedOffline = sub => {
                //     return sub.lastSynced === 0 && sub.added > this._eventTimeline.disconnect && sub.added < this._eventTimeline.connect;
                // };
                const hasStaleValue = sub => {
                    // --------------------------------
                    // | cursor |   added   | stale   |
                    // -------------------------------|
                    // |   no   |  online   |  no     |
                    // |   no   |  offline  |  yes    |
                    // |   no   |  b/disct  |  yes    |
                    // |   yes  |  online   |  no     |
                    // |   yes  |  offline  |  yes    |
                    // |   yes  |  b/disct  |  no     |
                    // --------------------------------
                    const addedWhileOffline = sub.added > this._eventTimeline.disconnect && sub.added < this._eventTimeline.connect;
                    const addedBeforeDisconnection = sub.added < this._eventTimeline.disconnect;
                    if (addedWhileOffline) { return true; }
                    if (addedBeforeDisconnection) { return cursor ? false : true; }
                    return false;
                }
                strategy.reload = subscriptionPaths
                    .filter(path => {
                        if (path.includes('*') || path.includes('$')) { return false; } // Can't load wildcard paths
                        return subscriptions.for(path).some(sub => {
                            if (hasStaleValue(sub)) {
                                if (typeof sub.settings.syncFallback === 'function') { return false; }
                                if (sub.settings.syncFallback === 'reload') { return true; }
                                if (sub.event === 'value') { return true; }
                                if (sub.event === 'child_added' && !sub.settings.newOnly) { return true; }
                            }
                            return false;
                        });
                    })
                    .reduce((reloadPaths, path) => {
                        !reloadPaths.some(p => p === path || PathInfo.get(p).isAncestorOf(path)) && reloadPaths.push(path);
                        return reloadPaths;
                    }, []);
                strategy.fallback = subscriptionPaths
                    .filter(path => !strategy.reload.some(p => p === path || PathInfo.get(p).isAncestorOf(path)))
                    .reduce((fallbackItems, path) => {
                        subscriptions.for(path).forEach(sub => {
                            if (hasStaleValue(sub) && typeof sub.settings.syncFallback === 'function') {
                                fallbackItems.push(sub);
                            }
                        });
                        return fallbackItems;
                    }, []);
                strategy.cursor = !cursor ? [] : subscriptionPaths
                    .filter(path => !strategy.reload.some(p => p === path || PathInfo.get(p).isAncestorOf(path)))
                    .reduce((cursorItems, path) => {
                        const subs = subscriptions.for(path);
                        const events = subs.filter(sub => !hasStaleValue(sub) && !strategy.fallback.includes(sub))
                            .reduce((events, sub) => (events.includes(sub.event) || events.push(sub.event)) && events, []);
                        events.length > 0 && cursorItems.push({ path, events });
                        return cursorItems;
                    }, []);
                strategy.warn = subscriptionPaths
                    .filter(path => !strategy.reload.some(p => p === path || PathInfo.get(p).isAncestorOf(path)))
                    .reduce((warnItems, path) => {
                        const subs = subscriptions.for(path).filter(sub => !strategy.fallback.includes(sub));
                        subs.forEach(sub => {
                            if (typeof sub.settings.syncFallback === 'function' || sub.added > this._eventTimeline.connect) {
                                strategy.noop.push(sub);
                            }
                            else if (!strategy.cursor.some(item => item.path === sub.path && item.events.includes(sub.event))) {
                                let item = warnItems.find(item => item.path === sub.path);
                                if (!item) {
                                    warnItems.push({ path: sub.path, events: [sub.event] })
                                }
                                else if (!item.events.includes(sub.event)) {
                                    item.events.push(sub.event);
                                }
                            }
                        });
                        return warnItems;
                    }, []);

                console.log(`SYNC strategy`, strategy);

                const syncPromises = [];
                if (strategy.cursor.length > 0) {
                    this.debug.log(`SYNC using cursor "${cursor}" for event(s) ${strategy.cursor.map(item => `${item.events.join(', ')} on "/${item.path}"`).join(', ')}`);
                    const cursorPromise = (async () => {
                        let remoteMutations;
                        try {
                            remoteMutations = await this.getMutations({ for: strategy.cursor, cursor, compressed: true });
                        }
                        catch(err) {
                            this.debug.error(`SYNC: Could not load remote mutations`, err);
                            options.eventCallback && options.eventCallback('sync_cursor_error', err);
                            if (err.code === 'no_transaction_logging') {
                                // Apparently the server did support transaction logging before, but is now disabled.
                                // Remove cursor so it won't be used again.
                                this._updateCursor(null);
                            }
                            // Check which subscriptions we'll be able to reload, and which we'll have to issue warnings for
                            strategy.cursor.forEach(item => {
                                if (item.events.includes('value')) {
                                    strategy.reload.push(item.path);
                                }
                                else {
                                    strategy.warn.push(item);
                                }
                            });
                        }
                        if (remoteMutations) {
                            usedSyncMethod = 'cursor';
                            this.debug.log(`SYNC: Got ${remoteMutations.length} remote mutations`, remoteMutations);
                            const promises = remoteMutations.map(m => {
                                const cachePath = `${this.dbname}/cache/${m.path}`;
                                if (m.type === 'update') {
                                    return cacheApi.update(cachePath, m.value, { context: m.context });
                                }
                                else if (m.type === 'set') {
                                    return cacheApi.set(cachePath, m.value, { context: m.context });
                                }
                            });
                            await Promise.all(promises);                        
                        }
                    })();
                    syncPromises.push(cursorPromise);
                }
                if (strategy.reload.length > 0) {
                    this.debug.log(`SYNC reloading data for event paths ${strategy.reload.map(path => `"/${path}"`).join(', ')}`);
                    const reloadPromise = (async () => {
                        const promises = strategy.reload.map(path => {
                            this.debug.verbose(`SYNC: load "/${path}"`);
                            return this.get(path, { allow_cache: false })
                            .catch(err => {
                                this.debug.error(`SYNC: could not load "/${path}"`, err);
                                options.eventCallback && options.eventCallback('sync_pull_error', err);
                            });
                        });
                        await Promise.all(promises);                        
                    })();
                    syncPromises.push(reloadPromise);
                }
                if (strategy.fallback.length > 0) {
                    this.debug.log(`SYNC using fallback functions for event(s) ${strategy.fallback.map(sub => `${sub.event} on "/${sub.path}"`).join(', ')}`);
                    const fallbackPromise = (async () => {
                        const promises = strategy.fallback.map(async sub => {
                            this.debug.verbose(`SYNC: running fallback for event ${sub.event} on "/${sub.path}"`);
                            try {
                                await sub.settings.syncFallback();
                            }
                            catch (err) {
                                this.debug.error(`SYNC: error running fallback function for ${sub.event} on "/${sub.path}"`, err);
                                options.eventCallback && options.eventCallback('sync_fallback_error', err);
                            }
                        });
                        await Promise.all(promises);                        
                    })();
                    syncPromises.push(fallbackPromise);
                }
                if (strategy.warn.length > 0) {
                    this.debug.warn(`SYNC warning: unable to sync event(s) ${strategy.warn.map(item => `${item.events.map(event => `"${event}"`).join(', ')} on "/${item.path}"`).join(', ')}. To resolve this, provide syncFallback functions for these events`);
                }

                // Wait until they're all done
                await Promise.all(syncPromises);

                // let remoteMutations;
                // if (cursor) {
                //     // Fetch mutations since cursor. This will get (net) mutations since cursor. 
                //     // This will include the changes on subscribed paths we pushed just now

                //     const targets = 
                //         Object.keys(this._subscriptions)
                //         .map(path => ({ path, events: this._subscriptions[path].map(sub => sub.event) }));

                //     try {
                //         remoteMutations = await this.getMutations({ for: targets, cursor, compressed: true });
                //     }
                //     catch(err) {
                //         this.debug.error(`SYNC: Could not load remote mutations`, err);
                //         if (err.code === 'no_transaction_logging') {
                //             // Apparently the server did support transaction logging before, but is now disabled
                //             this._updateCursor(null);
                //         }
                //         else {
                //             // Failed for some other reason. Keep the cursor but resume with "legacy" data fetching
                //         }
                //     }
                // }

                // if (remoteMutations) {
                //     usedSyncMethod = 'cursor';
                //     this.debug.log(`SYNC: Got ${remoteMutations.length} remote mutations`, remoteMutations);
                //     const promises = remoteMutations.map(m => {
                //         const cachePath = `${this.dbname}/cache/${m.path}`;
                //         if (m.type === 'update') {
                //             return cacheApi.update(cachePath, m.value, { context: m.context });
                //         }
                //         else if (m.type === 'set') {
                //             return cacheApi.set(cachePath, m.value, { context: m.context });
                //         }
                //     });
                //     await Promise.all(promises);
                // }
                // else {
                //     // Find out what data to load
                //     const loadPaths = Object.keys(this._subscriptions).reduce((paths, path) => {
                //         const isWildcardPath = path.includes('*') || path.includes('$');
                //         if (!paths.includes(path) && !isWildcardPath) {
                //             const hasValueSubscribers = this._subscriptions[path].some(s => !['mutated','mutations'].includes(s.event) && !s.event.startsWith('notify_'));
                //             if (hasValueSubscribers) {
                //                 const pathInfo = PathInfo.get(path);
                //                 const ancestorIncluded = paths.some(otherPath => pathInfo.isDescendantOf(otherPath));
                //                 if (!ancestorIncluded) { paths.push(path); }
                //             }
                //         }
                //         return paths;
                //     }, []);
                    
                //     const syncPullPromises = loadPaths.map(path => {
                //         this.debug.verbose(`SYNC: load "/${path}"`);
                //         return this.get(path, { allow_cache: false })
                //         .catch(err => {
                //             this.debug.error(`SYNC: could not load "/${path}"`, err);
                //             options.eventCallback && options.eventCallback('sync_pull_error', err);
                //         });
                //     });
                //     await Promise.all(syncPullPromises);                    
                // }

                // Wait shortly to allow any pending temp cache events to fire
                await new Promise(resolve => setTimeout(resolve, 10));         

                // Unsubscribe temp cache subscriptions
                subscriptions.forEach(sub => {
                    console.assert(typeof sub.tempCallback === 'function');
                    cacheApi.unsubscribe(PathInfo.getChildPath(`${this.dbname}/cache`, sub.path), sub.event, sub.tempCallback);
                    delete sub.tempCallback;
                });
            }
            else if (!this._cache) {
                // Not using cache
                const syncPromises = [];
                
                // No cache database used
                // Until acebase-server supports getting missed events with a cursor (in addition to getting mutations),
                // there is no way for the client to determine exact data changes at this moment - we have no previous values.
                // We can only fetch fresh data for 'value' events, run syncFallback functions and warn about all other events

                subscriptionPaths.forEach(path => {
                    const subs = subscriptions.for(path);
                    const warnEvents = [];
                    subs.filter(sub => sub.event !== 'value').forEach(sub => {
                        if (typeof sub.settings.syncFallback === 'function') {
                            syncPromises.push(sub.settings.syncFallback());
                        }
                        else {
                            !warnEvents.includes(sub.event) && warnEvents.push(sub.event);
                        }
                    })
                    if (warnEvents.length > 0) {
                        this.debug.warn(`Subscriptions ${warnEvents.join(', ')} on path "${path}" might have missed events while offline. Data should be reloaded!`);
                    }
                    const valueSubscriptions = subs.filter(sub => sub.event === 'value');
                    if (valueSubscriptions.length > 0) {
                        const p = this.get(path, { allow_cache: false }).then(value => {
                            valueSubscriptions.forEach(subscr => subscr.callback(null, path, value)); // No previous value!
                        });
                        syncPromises.push(p);
                    }
                });

                await Promise.all(syncPromises);
            }

            // Update subscription sync stats
            subscriptions.forEach(sub => sub.lastSynced = Date.now());

            this.debug.verbose(`SYNC done`);
            const info = { local: totalPendingChanges, remote: totalRemoteChanges, method: usedSyncMethod, cursor };
            options.eventCallback && options.eventCallback('sync_done', info);
            return info;
        }
        catch(err) {
            this.debug.error(`SYNC error`, err);
            options.eventCallback && options.eventCallback('sync_error', err);
            throw err;
        }
    }

    /**
     * Gets all relevant mutations for specific events on a path and since specified cursor
     * @param {object} filter
     * @param {string} [filter.path] path to get all mutations for, only used if `for` property isn't used
     * @param {Array<{ path: string, events: string[] }>} [filter.for] paths and events to get relevant mutations for
     * @param {string} filter.cursor cursor to use
     */
    async getMutations(filter) {
        if (typeof filter !== 'object') { throw new Error('No filter specified'); }
        if (typeof filter.cursor !== 'string') { throw new Error('No cursor given'); }
        const query = Object.keys(filter)
            .map(key => {
                let val = filter[key];
                if (key === 'for') { val = encodeURIComponent(JSON.stringify(val)); }
                return `${key}=${val}`;
            })
            .join('&');
        return this._request({ url: `${this.url}/sync/mutations/${this.dbname}?${query}` }); // /${filter.path}
    }

    async _addCacheSetMutation(path, value, context) {
        // Remove all previous mutations on this exact path, and descendants
        const escapedPath = path.replace(/([.*+?\\$^\(\)\[\]\{\}])/g, '\\$1'); // Replace any character that could cripple the regex. NOTE: nobody should use these characters in their data paths in the first place.
        const re = new RegExp(`^${escapedPath}(?:\\[|/|$)`); // matches path, path/child, path[0], path[0]/etc, path/child/etc/etc
        await this._cache.db.query(`${this.dbname}/pending`)
            .filter('path', 'matches', re)
            .remove();

        // Add new mutation
        return this._cache.db.api.set(`${this.dbname}/pending/${ID.generate()}`, { type: value !== null ? 'set' : 'remove', path, data: value, context });
    }

    set(path, value, options = { allow_cache: true, context: {} }) {
        if (!options.context) { options.context = {}; }
        const useCache = this._cache && options.allow_cache !== false;
        const useServer = this.isConnected;
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
        const addPendingTransaction = async () => {
            await this._addCacheSetMutation(path, value, options.context);
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
        });

        if (!useServer) {
            // Fixes issue #7
            return cachePromise;
        }

        // return server promise by default, so caller can handle potential authorization issues
        return this._cache.priority === 'cache' ? cachePromise : serverPromise;
    }

    update(path, updates, options = { allow_cache: true, context: {} }) {
        const useCache = this._cache && options && options.allow_cache !== false;
        const useServer = this.isConnected;
        options.context.acebase_mutation = options.context.acebase_mutation || {
            client_id: this._id,
            id: ID.generate(),
            op: 'update',
            path,
            flow: useCache ? useServer ? 'parallel' : 'cache' : 'server'
        };
        const updateServer = () => {
            const data = JSON.stringify(Transport.serialize(updates));
            return this._request({ method: 'POST', url: `${this.url}/data/${this.dbname}/${path}`, data, context: options.context });
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
            .then(result => {
                rollbackUpdates = result.value;
                return cacheApi.update(cachePath, updates, { context: options.context });
            });
        };
        // const deleteCache = () => {
        //     return this._cache.db.api.set(`${this.dbname}/cache/${path}`, null);
        // };
        const rollbackCache = () => {
            return cacheApi.update(cachePath, rollbackUpdates, { context: options.context });
        };
        const addPendingTransaction = async () => {
            /*

            In the old method, making multiple changes to the same data would store AND SYNC each
            mutation separately. To only store net changes to the db, having mixed 'update' and 'set' mutations
            make this hard. Consider the following mutations:

                1. update 'users/ewout': { name: 'Ewout', surname: 'Stortenbeker' }
                2. update 'users/ewout/address': { street: 'Main street', nr: 3 }
                3. update 'users/ewout': { name: 'E', address: null }
                4. update 'users/ewout': { name: 'E', address: { street: '2nd Ave', nr: 48 } }
                5. set 'users/ewout/address/street': 'Main street'
                6. set 'users/ewout/address/nr': 3
                7. set 'users/ewout/name': 'Ewout'

            If all updated properties are saved as 'set' operations, things become easier:

                1a. set 'users/ewout/name': 'Ewout'
                1b. set 'users/ewout/surname': 'Stortenbeker'
                2a. set 'users/ewout/address/street': 'Main street'
                2b. set 'users/ewout/address/nr': 3
                3a. set 'users/ewout/name': 'E'
                3b. set 'users/ewout/address': null
                4a. set 'users/ewout/name': 'E'
                4b. set 'users/ewout/address': { street: '2nd Ave', nr: 48 }
                5.  set 'users/ewout/address/street': 'Main street'
                6.  set 'users/ewout/address/nr': 3
                7.  set 'users/ewout/name': 'Ewout'

            Now it's easy to remove obsolete mutations, only keeping the last ones:

                1b. set 'users/ewout/surname': 'Stortenbeker'
                4b. set 'users/ewout/address': { street: '2nd Ave', nr: 48 }
                5.  set 'users/ewout/address/street': 'Main street'
                6.  set 'users/ewout/address/nr': 3
                7.  set 'users/ewout/name': 'Ewout'

            */

            // Create 'set' mutations for all of this 'update's properties
            const pathInfo = PathInfo.get(path);
            const mutations = Object.keys(updates).map(prop => {
                if (updates instanceof Array) { prop = parseInt(prop); }
                return {
                    path: pathInfo.childPath(prop),
                    value: updates[prop]
                };
            });

            // Store new pending 'set' operations (null values will be stored as 'remove')
            const promises = mutations.map(m => this._addCacheSetMutation(m.path, m.value, options.context));
            await Promise.all(promises);
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

        if (!useServer) {
            // Fixes issue #7
            return cachePromise;
        }

        // return server promise by default, so caller can handle potential authorization issues
        return this._cache.priority === 'cache' ? cachePromise : serverPromise;
    }

    /**
     * 
     * @param {string} path 
     * @param {object} [options] 
     * @returns {Promise<{ value: any, context: object }>} Returns a promise that resolves with the value and context (NEW)
     */
    async get(path, options = { allow_cache: true }) {
        const useCache = this._cache && options.allow_cache !== false;
        const getServerValue = async () => {
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
            const result = await this._request({ url, includeContext: true });
            const context = result.context;
            const value = Transport.deserialize(result.data);
            if (this._cache) {
                // Update cache without waiting
                // DISABLED: if filtered data was requested, it should be merged with current data (nested objects in particular)
                // if (filtered) {
                //     this._cache.db.api.update(`${this.dbname}/cache/${path}`, val);
                // }
                if (!filtered) {
                    const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
                    this._cache.db.api.set(cachePath, value, { context: { acebase_operation: 'update_cache', acebase_server_context: context } })
                    .catch(err => {
                        this.debug.error(`Error caching data for "/${path}"`, err)
                    });
                }
            }
            return { value, context };

        };
        const getCacheValue = () => {
            return this._cache.db.api.get(PathInfo.getChildPath(`${this.dbname}/cache`, path), options);
        };

        if (!useCache) {
            const { value, context } = await getServerValue();
            context.acebase_origin = 'server';
            return { value, context };
        }
        else if (!this.isConnected || this._cache.priority === 'cache') {
            const { value, context } = await getCacheValue();
            context.acebase_origin = 'cache';
            return { value, context };
        }
        else {
            // Get both, use cached value if available and server version takes too long
            return new Promise((resolve, reject) => {
                let wait = true, done = false;
                const gotValue = (source, val) => {
                    // console.log(`Got ${source} value of "${path}":`, val);
                    if (done) { return; }
                    const { value, context } = val;
                    if (source === 'server') {
                        done = true;
                        // console.log(`Using server value for "${path}"`);
                        context.acebase_origin = 'server';
                        resolve({ value, context });
                    }
                    else if (value === null) {
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
                        context.acebase_origin = 'cache';
                        resolve({ value, context });
                    }
                    else {
                        // Cached results, wait 1s before resolving with this value, server value might follow soon
                        setTimeout(() => {
                            if (done) { return; }
                            console.log(`Using (delayed) cache value for "${path}"`);
                            done = true;
                            context.acebase_origin = 'cache';
                            resolve({ value, context });
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
        else if (!this.isConnected) {
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

    clearCache(path = '') {
        if (this._cache) {
            // Clear cache without raising events
            const value = path === '' ? {} : null;
            if (path !== '') { path = `cache/${path}`; }
            return this._cache.db.api.set(path, value, { suppress_events: true });
        }
        else {
            return Promise.resolve();
        }
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
        if (allowCache && !this.isConnected && this._cache) {
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
        return this._request({ method: 'POST', url: `${this.url}/query/${this.dbname}/${path}`, data })
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
        return this._request({ method: 'POST', url: `${this.url}/index/${this.dbname}`, data })
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

    setSchema(path, schema) {
        if (schema !== null) {
            schema = (new SchemaDefinition(schema)).text;
        }
        const data = JSON.stringify({ action: "set", path, schema });
        return this._request({ method: 'POST', url: `${this.url}/schema/${this.dbname}`, data })
        .catch(err => {
            throw err;
        });
    }

    getSchema(path) {
        return this._request({ url: `${this.url}/schema/${this.dbname}/${path}` })
        .catch(err => {
            throw err;
        });
    }

    getSchemas() {
        return this._request({ url: `${this.url}/schema/${this.dbname}` })
        .catch(err => {
            throw err;
        });
    }

    validateSchema(path, value, isUpdate) {
        throw new Error(`Manual schema validation can only be used on standalone databases`);
    }
}

module.exports = { WebApi };