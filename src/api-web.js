const { Api, transport, debug } = require('acebase');
const http = require('http');
const connectSocket = require('socket.io-client');
const URL = require('url');
const uuid62 = require('uuid62');

class AceBaseRequestError extends Error {
    constructor(request, response, message) {
        super(message);
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
                    let val = JSON.parse(data);
                    resolve(val);
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
                    response.body = data;
                    return reject(new AceBaseRequestError(request, response, `${res.statusCode} ${res.statusMessage}`));
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

    const requestId = uuid62.v1();
    data.req_id = requestId;
    data.access_token = accessToken;

    socket.emit(event, data);

    let resolve, reject;
    let promise = new Promise((res, rej) => { resolve = res; reject = rej; });

    const handle = data => {
        if (data.req_id === requestId) {
            socket.off("result", handle);
            if (data.success) {
                resolve(data);
            }
            else {
                // Access denied?
                reject(data.reason);
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
    constructor(dbname = "default", url, readyCallback) {
        // operations are done through http calls,
        // events are triggered through a websocket
        super();

        this.url = url;
        this.dbname = dbname;
        debug.log(`Connecting to AceBase server "${url}"`);
        if (!url.startsWith('https')) {
            console.error(`WARNING: The server you are connecting to does not use https, any data transferred may be intercepted!`)
        }

        let subscriptions = {};
        let accessToken;
        const socket = this.socket = connectSocket(url);
        
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
            if (readyCallback) {
                readyCallback();
                readyCallback = null; // once! :-)
            }
            // Resubscribe to any active subscriptions
            if (reconnectSubs === null) { return; }
            Object.keys(reconnectSubs).forEach(path => {
                reconnectSubs[path].forEach(subscr => {
                    this.subscribe(subscr.ref, subscr.event, subscr.callback);
                });
            });
            reconnectSubs = null;
        });

        socket.on("disconnect", (data) => {
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
                    let val = transport.deserialize(data.val);
                    subscr.callback(null, data.path, val.current, val.previous);
                }
            });
        });

        this.subscribe = (ref, event, callback) => {
            let pathSubs = subscriptions[ref.path];
            if (!pathSubs) { pathSubs = subscriptions[ref.path] = []; }
            let serverAlreadyNotifying = pathSubs.some(sub => sub.event === event);
            pathSubs.push({ ref, event, callback });

            if (serverAlreadyNotifying) {
                return Promise.resolve();
            }
            return _websocketRequest(socket, "subscribe", { path: ref.path, event }, accessToken);
        };

        this.unsubscribe = (ref, event = undefined, callback = undefined) => {
            let pathSubs = subscriptions[ref.path];
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
                delete subscriptions[ref.path];
                // socket.emit("unsubscribe", { path: ref.path, access_token: accessToken });
                return _websocketRequest(socket, "unsubscribe", { path: ref.path, access_token: accessToken }, accessToken);
            }
            else if (pathSubs.reduce((c, subscr) => c + (subscr.event === event ? 1 : 0), 0) === 0) {
                // No callbacks left for specific event
                // socket.emit("unsubscribe", { path: ref.path, event, access_token: accessToken });
                return _websocketRequest(socket, "unsubscribe", { path: ref.path, event, access_token: accessToken }, accessToken);
            }
        };

        this.transaction = (ref, callback) => {
            const id = uuid62.v1();
            const startedCallback = (data) => {
                if (data.id === id) {
                    socket.off("tx_started", startedCallback);
                    const currentValue = transport.deserialize(data.value);
                    const val = callback(currentValue);
                    const finish = (val) => {
                        const newValue = transport.serialize(val);
                        socket.emit("transaction", { action: "finish", id: id, path: ref.path, value: newValue, access_token: accessToken });
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
            socket.on("tx_started", startedCallback);
            socket.on("tx_completed", completedCallback);
            socket.emit("transaction", { action: "start", id, path: ref.path, access_token: accessToken });
            return new Promise((resolve) => {
                txResolve = resolve;
            });
        };

        this._request = (method, url, data) => {
            return _request(method, url, data, accessToken)
            .catch(err => {
                throw err;
            });
        };

        this.signIn = (username, password) => {
            return _request("POST", `${this.url}/auth/${this.dbname}/signin`, { method: 'account', username, password }, accessToken)
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
            return _request("POST", `${this.url}/auth/${this.dbname}/signin`, { method: 'token', access_token: token })
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
            return _request("POST", `${this.url}/auth/${this.dbname}/signout`, {}, accessToken)
            .then(() => {
                socket.emit("signout");
            })
            .catch(err => {
                throw err;
            });
        };

        this.changePassword = (uid, currentPassword, newPassword) => {
            if (!accessToken) { return Promise.reject(new Error(`not_signed_in`)); }
            return _request("POST", `${this.url}/auth/${this.dbname}/change_password`, { uid, password: currentPassword, new_password: newPassword }, accessToken)
            .then(result => {
                accessToken = result.access_token;
            })
            .catch(err => {
                throw err;
            });
        };
    
        this.signUp = (username, password, displayName) => {
            return _request("POST", `${this.url}/auth/${this.dbname}/signup`, { username, password, display_name: displayName }, accessToken)
            .then(result => {
                accessToken = result.access_token;
                socket.emit("signin", accessToken);
                return result.user;
            })
            .catch(err => {
                throw err;
            });
        };
    }


    stats(options = undefined) {
        return this._request("GET", `${this.url}/stats/${this.dbname}`);
    }

    set(ref, value) {
        const data = JSON.stringify(transport.serialize(value));
        return this._request("PUT", `${this.url}/data/${this.dbname}/${ref.path}`, data)
        .then(result => ref)
        .catch(err => {
            throw err;
        });
    }

    update(ref, updates) {
        const data = JSON.stringify(transport.serialize(updates));
        return this._request("POST", `${this.url}/data/${this.dbname}/${ref.path}`, data)
        .then(result => ref)
        .catch(err => {
            throw err;
        });
    }
  
    get(ref, options = undefined) {
        let url = `${this.url}/data/${this.dbname}/${ref.path}`;
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
            let val = transport.deserialize(data);
            return val;                
        })
        .catch(err => {
            throw err;
        });
    }

    exists(ref) {
        return this._request("GET", `${this.url}/exists/${this.dbname}/${ref.path}`)
        .then(res => res.exists)
        .catch(err => {
            throw err;
        });
    }

    query(ref, query, options = { snapshots: false }) {
        const data = JSON.stringify(transport.serialize({
            query,
            options
        }));
        return this._request("POST", `${this.url}/query/${this.dbname}/${ref.path}`, data)
        .then(data => {
            let results = transport.deserialize(data);
            return results.list;
        })
        .catch(err => {
            throw err;
        });        
    }

    createIndex(path, key) {
        const data = JSON.stringify({ action: "create", path, key });
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