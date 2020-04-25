const { Api, Transport, DebugLogger, ID } = require('acebase-core');
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

    constructor(dbname = "default", settings, eventCallback) {
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

        let subscriptions = {};
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

                let reconnectSubs = null;

                socket.on("connect", (data) => {
                    this._connecting = false;
                    this._connected = true;
                    eventCallback && eventCallback('connect');

                    // Sign in again
                    let signInPromise = Promise.resolve();
                    if (accessToken) {
                        signInPromise = this.signInWithToken(accessToken);
                    }
                    signInPromise.then(() => {
                        // Resubscribe to any active subscriptions
                        reconnectSubs !== null && Object.keys(reconnectSubs).forEach(path => {
                            reconnectSubs[path].forEach(subscr => {
                                this.subscribe(subscr.path, subscr.event, subscr.callback);
                            });
                        });
                        reconnectSubs = null;
                        resolve();
                    });
                });

                socket.on("disconnect", (data) => {
                    // Existing connection was broken, by us or network
                    this._connected = false;
                    eventCallback && eventCallback('disconnect');
                    reconnectSubs = subscriptions;
                    subscriptions = {};
                });

                socket.on("data-event", data => {
                    const pathSubs = subscriptions[data.subscr_path];
                    if (!pathSubs) {
                        // weird. we are not subscribed on this path?
                        this.debug.warn(`Received a data-event on a path we did not subscribe to: "${data.path}"`);
                        return;
                    }
                    pathSubs.forEach(subscr => {
                        if (subscr.event === data.event) {
                            let val = Transport.deserialize(data.val);
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
            pathSubs.push({ path, event, callback });

            if (serverAlreadyNotifying) {
                return Promise.resolve();
            }
            return _websocketRequest(this.socket, "subscribe", { path, event }, accessToken);
        };

        this.unsubscribe = (path, event = undefined, callback = undefined) => {
            let pathSubs = subscriptions[path];
            if (!pathSubs) { return; }
            if (!event) {
                // Unsubscribe from all events
                pathSubs = [];
            }
            else if (!callback) {
                // Unsubscribe from specific event
                const remove = pathSubs.filter(subscr => subscr.event === event);
                remove.forEach(subscr => pathSubs.splice(pathSubs.indexOf(subscr), 1));
            }
            else {
                // Unsubscribe from a specific callback
                const remove = pathSubs.filter(subscr => subscr.event === event && subscr.callback === callback);
                remove.forEach(subscr => pathSubs.splice(pathSubs.indexOf(subscr), 1));
            }

            if (pathSubs.length === 0) {
                // Unsubscribe from all events on path
                delete subscriptions[path];
                // socket.emit("unsubscribe", { path, access_token: accessToken });
                return _websocketRequest(this.socket, "unsubscribe", { path, access_token: accessToken }, accessToken);
            }
            else if (pathSubs.reduce((c, subscr) => c + (subscr.event === event ? 1 : 0), 0) === 0) {
                // No callbacks left for specific event
                // socket.emit("unsubscribe", { path, event, access_token: accessToken });
                return _websocketRequest(this.socket, "unsubscribe", { path: path, event, access_token: accessToken }, accessToken);
            }
        };

        this.transaction = (path, callback) => {
            const id = ID.generate();
            const startedCallback = (data) => {
                if (data.id === id) {
                    this.socket.off("tx_started", startedCallback);
                    const currentValue = Transport.deserialize(data.value);
                    const val = callback(currentValue);
                    const finish = (val) => {
                        const newValue = Transport.serialize(val);
                        this.socket.emit("transaction", { action: "finish", id: id, path, value: newValue, access_token: accessToken });
                    };
                    if (val instanceof Promise) {
                        val.then(finish);
                    }
                    else {
                        finish(val);
                    }
                }
            }
            let txResolve;
            const completedCallback = (data) => {
                if (data.id === id) {
                    this.socket.off("tx_completed", completedCallback);
                    txResolve(this);
                }
            }
            const connectedCallback = () => {
                this.socket.on("tx_started", startedCallback);
                this.socket.on("tx_completed", completedCallback);
                // TODO: socket.on('disconnect', disconnectedCallback);
                this.socket.emit("transaction", { action: "start", id, path, access_token: accessToken });
            };
            if (this._connected) { connectedCallback(); }
            else { this.socket.on('connect', connectedCallback); }
            return new Promise((resolve) => {
                txResolve = resolve;
            });
        };

        this._request = (method, url, data, dataReceivedCallback) => {
            if (this._connected) { 
                return _request(method, url, data, accessToken, dataReceivedCallback)
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
                        this._request(method, url, data)
                        .then(resolve)
                        .catch(reject);
                    };
                this.socket.on('connect', callback); // wait for connection
                return promise;
            }
        };

        this.signIn = (username, password) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request("POST", `${this.url}/auth/${this.dbname}/signin`, { method: 'account', username, password, client_id: this.socket.id })
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
            return this._request("POST", `${this.url}/auth/${this.dbname}/signin`, { method: 'email', email, password, client_id: this.socket.id })
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
            return this._request("POST", `${this.url}/auth/${this.dbname}/signin`, { method: 'token', access_token: token, client_id: this.socket.id })
            .then(result => {
                accessToken = result.access_token;
                this.socket.emit("signin", accessToken); // Make sure the connected websocket server knows who we are as well. 
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.signOut = () => {
            if (!accessToken) { return Promise.resolve(); }
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request("POST", `${this.url}/auth/${this.dbname}/signout`, { client_id: this.socket.id })
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
            return this._request("POST", `${this.url}/auth/${this.dbname}/change_password`, { uid, password: currentPassword, new_password: newPassword })
            .then(result => {
                accessToken = result.access_token;
                return { accessToken };
            })
            .catch(err => {
                throw err;
            });
        };
    
        this.signUp = (details) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request("POST", `${this.url}/auth/${this.dbname}/signup`, details)
            .then(result => {
                accessToken = result.access_token;
                this.socket.emit("signin", accessToken);
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.updateUserDetails = (details) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request("POST", `${this.url}/auth/${this.dbname}/update`, details)
            .then(result => {
                return { user: result.user };
            })
            .catch(err => {
                throw err;
            });
        }

        this.deleteAccount = (uid) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request("POST", `${this.url}/auth/${this.dbname}/delete`, { uid })
            .then(result => {
                this.socket.emit("signout", accessToken);
                accessToken = null;
                return true;
            })
            .catch(err => {
                throw err;
            });
        }
    }

    stats(options = undefined) {
        return this._request("GET", `${this.url}/stats/${this.dbname}`);
    }

    sync(eventCallback) {
        // Sync cache
        if (!this._connected) {
            return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
        }
        if (!this._cache) {
            return Promise.reject(new Error(`no cache database is used`));
        }
        if (!this._cache.db.isReady) {
            return Promise.reject(new Error(`cache database is not ready yet`));
        }

        const handleStatsUpdateError = err => {
            this.debug.error(`Failed to update cache db stats:`, err);
        }
        let totalPendingChanges = 0;
        const cacheApi = this._cache.db.api;
        return cacheApi.get(`${this.dbname}/pending`) //cacheDb.ref('pending_changes').get()
        .then(pendingChanges => {
            eventCallback && eventCallback('sync_start');            
            cacheApi.set(`${this.dbname}/stats/last_sync_start`, new Date()).catch(handleStatsUpdateError);
            if (pendingChanges === null) {
                return; // No updates
            }
            const updates = Object.keys(pendingChanges).map(id => {
                const change = pendingChanges[id];
                let promise;
                if (change.type === 'update') { 
                    promise = this.update(change.path, change.data, { allow_cache: false });
                }
                else if (change.type === 'set') { 
                    promise = this.set(change.path, change.data, { allow_cache: false });
                }
                else {
                    throw new Error(`unsupported change type "${change.type}"`);
                }
                return promise
                .then(() => {
                    delete pendingChanges[id];
                    cacheApi.set(`${this.dbname}/pending/${id}`, null); // delete from cache db
                })
                .catch(err => {
                    // Updating remote db failed
                    if (!this._connected) {
                        // Connection was broken, should retry later
                        throw err;
                    }
                    // We are connected, so the change is not allowed or otherwise denied.
                    eventCallback && eventCallback('sync_change_error', change);
                    // Delete the change and cached data
                    cacheApi.set(`${this.dbname}/pending/${id}`, null);
                    cacheApi.set(`${this.dbname}/cache/${change.data.path}`, null);
                });
            });
            totalPendingChanges = updates.length;
            return Promise.all(updates);
        })
        .then(() => {
            cacheApi.set(`${this.dbname}/stats/last_sync_end`, new Date()).catch(handleStatsUpdateError);
            eventCallback && eventCallback('sync_done');
            return totalPendingChanges;
        })
        .catch(err => {
            // 1 or more pending changes could not be processed.
            if (typeof err === 'string') { 
                err = { code: 'unknown', message: err, stack: 'n/a' }; 
            }
            cacheApi.set(`${this.dbname}/stats/last_sync_error`, { date: new Date(), code: err.code || 'unknown', message: err.message, stack: err.stack }).catch(handleStatsUpdateError);
            eventCallback && eventCallback('sync_error', err);
            throw err;
        });
    }

    set(path, value, options = { allow_cache: true }) {
        const allowCache = options && options.allow_cache === true;
        // let cacheUpdates;
        // if (allowCache && this._cache) {
        //     cacheUpdates = this._processCacheUpdate('set', path, value);
        //     if (!this._connected) { 
        //         // Don't try updating remote db if the websocket isn't connected
        //         return cacheUpdates.promise;
        //     }
        // }
        const cache = {
            use: this._cache && allowCache,
            updateValue: () => { return this._cache.db.api.set(`${this.dbname}/cache/${path}`, value); },
            addPending: () => { const id = ID.generate(); return this._cache.db.api.set(`${this.dbname}/pending/${id}`, { type: 'set', path, data: value }); }
        };
        if (cache.use && !this._connected) {
            // Not connected, update cache database only
            return Promise.all([
                cache.updateValue(),
                cache.addPending()
            ]);
        }
        const data = JSON.stringify(Transport.serialize(value));
        return this._request("PUT", `${this.url}/data/${this.dbname}/${path}`, data)
        .then(() => {
            // return cacheUpdates && cacheUpdates.commit();
            return cache.use && cache.updateValue();
        })
        .catch(err => {
            // if (this._connected) {
            //     cacheUpdates && cacheUpdates.rollback();
            // }
            if (cache.use && !this._connected) {
                // It failed because we're not connected
                return cache.addPending();
            }
            throw err;
        });
    }

    update(path, updates, options = { allow_cache: true }) {
        const allowCache = options && options.allow_cache === true;
        const cache = {
            use: this._cache && allowCache,
            updateValue: () => { return this._cache.db.api.update(`${this.dbname}/cache/${path}`, updates); },
            addPending: () => { const id = ID.generate(); return this._cache.db.api.set(`${this.dbname}/pending/${id}`, { type: 'update', path, data: updates }); }
        };
        if (cache.use && !this._connected) {
            // Not connected, update cache database only
            return Promise.all([
                cache.updateValue(),
                cache.addPending()
            ]);
        }        
        const data = JSON.stringify(Transport.serialize(updates));
        return this._request("POST", `${this.url}/data/${this.dbname}/${path}`, data)
        .then(res => {
            return cache.use && cache.updateValue();
        })
        .catch(err => {
            if (cache.use && !this._connected) {
                // It failed because we're not connected
                return cache.addPending();
            }            
            throw err;
        });
    }
  
    get(path, options = { allow_cache: true }) {
        const allowCache = options && options.allow_cache === true;
        if (allowCache && !this._connected && this._cache) {
            // We're offline. Try loading from cache
            return this._cache.db.api.get(`${this.dbname}/cache/${path}`, options);
        }

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
        return this._request("GET", url)
        .then(data => {
            let val = Transport.deserialize(data);
            if (this._cache) {
                // Update cache without waiting
                // DISABLED: if filtered data was requested, it should be merged with current data (nested objects in particular)
                // TODO: do update if no nested filters are used.
                // if (filtered) {
                //     this._cache.db.api.update(`${this.dbname}/cache/${path}`, val);
                // }
                // else if (!filtered) { 
                if (!filtered) {
                    const cachePath = `${this.dbname}/cache/${path}`;
                    this._cache.db.api.set(cachePath, val)
                    .catch(err => {
                        this.debug.error(`Error caching data for "/${path}"`, err)
                    });
                }
            }
            return val;
        })
        .catch(err => {
            throw err;
        });
    }

    exists(path, options = { allow_cache: true }) {
        const allowCache = options && options.allow_cache === true;
        if (allowCache && !this._connected && this._cache) {
            // Not connected, peek cache
            return this._cache.db.api.exists(`${this.dbname}/cache/${path}`);
        }
        return this._request("GET", `${this.url}/exists/${this.dbname}/${path}`)
        .then(res => res.exists)
        .catch(err => {
            throw err;
        });
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
        return this._request("POST", `${this.url}/query/${this.dbname}/${path}`, data)
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
        return this._request("POST", `${this.url}/index/${this.dbname}`, data)
        .catch(err => {
            throw err;
        });
    }

    getIndexes() {
        return this._request("GET", `${this.url}/index/${this.dbname}`)
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
        return this._request("GET", url)
        .catch(err => {
            throw err;
        }); 
    }

    export(path, stream, options = { format: 'json' }) {
        options = options || {};
        options.format = 'json';
        let url = `${this.url}/export/${this.dbname}/${path}?format=${options.format}`;
        return this._request("GET", url, null, chunk => stream.write(chunk))
        .catch(err => {
            throw err;
        });
    }
}

module.exports = { WebApi };