const { Api, Transport, debug, ID } = require('acebase-core');
const http = require('http');
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

const _request = (method, url, postData, accessToken) => {
    return new Promise((resolve, reject) => {
        let endpoint = URL.parse(url);

        if (typeof postData === 'undefined') {
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
        const req = http.request(options, res => {
            res.setEncoding("utf8");
            let data = '';
            res.on('data', chunk => { data += chunk; });
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
                const err = new AceBaseRequestError(request, response, response.reason.code, response.reason.message);
                reject(err);
            }
        }
    };    
    socket.on("result", handle);

    return promise;
}

/**
 * Api to connect to a remote AceBase instance over http
 */
class WebApi extends Api {
    constructor(dbname = "default", settings, eventCallback) {
        // operations are done through http calls,
        // events are triggered through a websocket
        super();

        this.url = settings.url;
        this.dbname = dbname;
        this._connected = false;

        debug.log(`Connecting to AceBase server "${this.url}"`);
        if (!this.url.startsWith('https')) {
            console.error(`WARNING: The server you are connecting to does not use https, any data transferred may be intercepted!`)
        }

        let subscriptions = {};
        let accessToken;
        const socket = this.socket = connectSocket(this.url);
        
        socket.on("connect_error", (data) => {
            debug.error(`Websocket connection error: ${data}`);
            //debug.error(data);
        });

        socket.on("connect_timeout", (data) => {
            debug.error(`Websocket connection timeout`);
            //debug.error(data);
        });

        // socket.on("disconnect", (data) => {
        //     // Try to reconnect. Should do this in a retry loop
        //     socket.connect();
        // });

        let reconnectSubs = null;

        socket.on("connect", (data) => {
            this._connected = true;
            eventCallback && eventCallback('connect');

            // Sign in again
            let signInPromise = Promise.resolve();
            if (accessToken) {
                signInPromise = this.signInWithToken(accessToken);
            }
            signInPromise.then(() => {
                // Resubscribe to any active subscriptions
                if (reconnectSubs === null) { return; }
                Object.keys(reconnectSubs).forEach(path => {
                    reconnectSubs[path].forEach(subscr => {
                        this.subscribe(subscr.path, subscr.event, subscr.callback);
                    });
                });
                reconnectSubs = null;
            });
        });

        socket.on("disconnect", (data) => {
            this._connected = false;
            eventCallback && eventCallback('disconnect');
            reconnectSubs = subscriptions;
            subscriptions = {};
        });

        socket.on("data-event", data => {
            const pathSubs = subscriptions[data.subscr_path];
            if (!pathSubs) {
                // weird. we are not subscribed on this path?
                debug.warn(`Received a data-event on a path we did not subscribe to: "${data.path}"`);
                return;
            }
            pathSubs.forEach(subscr => {
                if (subscr.event === data.event) {
                    let val = Transport.deserialize(data.val);
                    subscr.callback(null, data.path, val.current, val.previous);
                }
            });
        });

        this.subscribe = (path, event, callback) => {
            let pathSubs = subscriptions[path];
            if (!pathSubs) { pathSubs = subscriptions[path] = []; }
            let serverAlreadyNotifying = pathSubs.some(sub => sub.event === event);
            pathSubs.push({ path, event, callback });

            if (serverAlreadyNotifying) {
                return Promise.resolve();
            }
            return _websocketRequest(socket, "subscribe", { path, event }, accessToken);
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
                return _websocketRequest(socket, "unsubscribe", { path, access_token: accessToken }, accessToken);
            }
            else if (pathSubs.reduce((c, subscr) => c + (subscr.event === event ? 1 : 0), 0) === 0) {
                // No callbacks left for specific event
                // socket.emit("unsubscribe", { path, event, access_token: accessToken });
                return _websocketRequest(socket, "unsubscribe", { path: path, event, access_token: accessToken }, accessToken);
            }
        };

        this.transaction = (path, callback) => {
            const id = ID.generate();
            const startedCallback = (data) => {
                if (data.id === id) {
                    socket.off("tx_started", startedCallback);
                    const currentValue = Transport.deserialize(data.value);
                    const val = callback(currentValue);
                    const finish = (val) => {
                        const newValue = Transport.serialize(val);
                        socket.emit("transaction", { action: "finish", id: id, path, value: newValue, access_token: accessToken });
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
                    socket.off("tx_completed", completedCallback);
                    txResolve(this);
                }
            }
            const connectedCallback = () => {
                socket.on("tx_started", startedCallback);
                socket.on("tx_completed", completedCallback);
                // TODO: socket.on('disconnect', disconnectedCallback);
                socket.emit("transaction", { action: "start", id, path, access_token: accessToken });
            };
            if (this._connected) { connectedCallback(); }
            else { socket.on('connect', connectedCallback); }
            return new Promise((resolve) => {
                txResolve = resolve;
            });
        };

        this._request = (method, url, data) => {
            if (this._connected) { 
                return _request(method, url, data, accessToken)
                .catch(err => {
                    throw err;
                }); 
            }
            else {
                let resolve;
                let promise = new Promise(r => resolve = r);
                socket.on('connect', () => {
                    this._request(method, url, data)
                    .then(resolve);
                });
                return promise;
            }
        };

        this.signIn = (username, password) => {
            return this._request("POST", `${this.url}/auth/${this.dbname}/signin`, { method: 'account', username, password })
            .then(result => {
                accessToken = result.access_token;
                socket.emit("signin", accessToken);
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.signInWithEmail = (email, password) => {
            return this._request("POST", `${this.url}/auth/${this.dbname}/signin`, { method: 'email', email, password })
            .then(result => {
                accessToken = result.access_token;
                socket.emit("signin", accessToken);
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.signInWithToken = (token) => {
            return this._request("POST", `${this.url}/auth/${this.dbname}/signin`, { method: 'token', access_token: token })
            .then(result => {
                accessToken = result.access_token;
                socket.emit("signin", accessToken);
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.signOut = () => {
            if (!accessToken) { return Promise.resolve(); }
            return this._request("POST", `${this.url}/auth/${this.dbname}/signout`, {})
            .then(() => {
                socket.emit("signout", accessToken);
                accessToken = null;
            })
            .catch(err => {
                throw err;
            });
        };

        this.changePassword = (uid, currentPassword, newPassword) => {
            if (!accessToken) { return Promise.reject(new Error(`not_signed_in`)); }
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
            return this._request("POST", `${this.url}/auth/${this.dbname}/signup`, details)
            .then(result => {
                accessToken = result.access_token;
                socket.emit("signin", accessToken);
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.updateUserDetails = (details) => {
            return this._request("POST", `${this.url}/auth/${this.dbname}/update`, details)
            .then(result => {
                return { user: result.user };
            })
            .catch(err => {
                throw err;
            });
        }

        this.deleteAccount = (uid) => {
            return this._request("POST", `${this.url}/auth/${this.dbname}/delete`, { uid })
            .then(result => {
                socket.emit("signout", accessToken);
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

    set(path, value) {
        const data = JSON.stringify(Transport.serialize(value));
        return this._request("PUT", `${this.url}/data/${this.dbname}/${path}`, data)
        .catch(err => {
            throw err;
        });
    }

    update(path, updates) {
        const data = JSON.stringify(Transport.serialize(updates));
        return this._request("POST", `${this.url}/data/${this.dbname}/${path}`, data)
        .catch(err => {
            throw err;
        });
    }
  
    get(path, options = undefined) {
        let url = `${this.url}/data/${this.dbname}/${path}`;
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
                url += `?${query.join('&')}`;
            }
        }
        return this._request("GET", url)
        .then(data => {
            let val = Transport.deserialize(data);
            return val;                
        })
        .catch(err => {
            throw err;
        });
    }

    exists(path) {
        return this._request("GET", `${this.url}/exists/${this.dbname}/${path}`)
        .then(res => res.exists)
        .catch(err => {
            throw err;
        });
    }

    query(path, query, options = { snapshots: false }) {
        const data = JSON.stringify(Transport.serialize({
            query,
            options
        }));
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
}

module.exports = { WebApi };