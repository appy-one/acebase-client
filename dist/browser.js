(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.acebaseclient = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AceBaseClient = exports.AceBaseClientConnectionSettings = void 0;
const acebase_core_1 = require("acebase-core");
const api_web_1 = require("./api-web");
const auth_1 = require("./auth");
const server_date_1 = require("./server-date");
/**
 * Settings to connect to a remote AceBase server
 */
class AceBaseClientConnectionSettings {
    constructor(settings) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        /**
         * Use SSL (https) to access the server or not. Default: `true`
         * @default true
         */
        this.https = true;
        /**
         * Automatically connect to the server, or wait until `db.connect()` is called
         * @default true
         */
        this.autoConnect = true;
        /**
         * Delay in ms before auto connecting. Useful for testing scenarios where both server and client start at the same time, and server needs to come online first.
         * @default 0
         */
        this.autoConnectDelay = 0;
        /**
         * debug logging level
         */
        this.logLevel = 'log';
        this.dbname = settings.dbname;
        this.host = settings.host;
        this.port = settings.port;
        this.https = typeof settings.https === 'boolean' ? settings.https : true;
        this.autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this.autoConnectDelay = typeof settings.autoConnectDelay === 'number' ? settings.autoConnectDelay : 0;
        this.logLevel = typeof settings.logLevel === 'string' ? settings.logLevel : 'log';
        this.sponsor = typeof settings.sponsor === 'boolean' ? settings.sponsor : false;
        // Set cache settings
        this.cache = {
            enabled: typeof ((_a = settings.cache) === null || _a === void 0 ? void 0 : _a.db) === 'object' && typeof ((_b = settings.cache) === null || _b === void 0 ? void 0 : _b.enabled) === 'boolean' ? settings.cache.enabled : false,
            db: typeof ((_c = settings.cache) === null || _c === void 0 ? void 0 : _c.db) === 'object' ? settings.cache.db : null,
            priority: typeof ((_d = settings.cache) === null || _d === void 0 ? void 0 : _d.priority) === 'string' && ['server', 'cache'].includes(settings.cache.priority) ? settings.cache.priority : 'server',
        };
        // Set sync settings
        this.sync = {
            timing: typeof ((_e = settings.sync) === null || _e === void 0 ? void 0 : _e.timing) === 'string' && ['connect', 'signin', 'auto', 'manual'].includes(settings.sync.timing) ? settings.sync.timing : 'auto',
            useCursor: typeof ((_f = settings.sync) === null || _f === void 0 ? void 0 : _f.useCursor) === 'boolean' ? settings.sync.useCursor : true,
        };
        // Set network settings
        const realtime = typeof ((_g = settings.network) === null || _g === void 0 ? void 0 : _g.realtime) === 'boolean' ? settings.network.realtime : true;
        this.network = {
            transports: ((_h = settings.network) === null || _h === void 0 ? void 0 : _h.transports) instanceof Array ? settings.network.transports : ['websocket'],
            realtime,
            monitor: typeof ((_j = settings.network) === null || _j === void 0 ? void 0 : _j.monitor) === 'boolean' ? settings.network.monitor : !realtime,
            interval: typeof ((_k = settings.network) === null || _k === void 0 ? void 0 : _k.interval) === 'number' ? settings.network.interval : 60,
        };
    }
}
exports.AceBaseClientConnectionSettings = AceBaseClientConnectionSettings;
/**
 * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
 */
class AceBaseClient extends acebase_core_1.AceBaseBase {
    /**
     * Create a client to access an AceBase server
     */
    constructor(init) {
        var _a;
        if (typeof init !== 'object') {
            // Use old constructor signature: host, port, dbname, https = true
            // eslint-disable-next-line prefer-rest-params
            const [host, port, dbname, https] = arguments;
            init = { host, port, dbname, https };
        }
        const settings = init instanceof AceBaseClientConnectionSettings ? init : new AceBaseClientConnectionSettings(init);
        super(settings.dbname, { info: 'realtime database client', sponsor: settings.sponsor });
        /*
            TODO: improve init flow with await/async (requires Node 7.6+)
        */
        const cacheDb = (_a = settings.cache) === null || _a === void 0 ? void 0 : _a.db;
        const cacheReadyPromise = cacheDb ? cacheDb.ready() : Promise.resolve();
        let ready = false;
        this.on('ready', () => { ready = true; });
        this.debug = new acebase_core_1.DebugLogger(settings.logLevel, `[${settings.dbname}]`.colorize(acebase_core_1.ColorStyle.blue)); // `[ ${settings.dbname} ]`
        const synchronizeClocks = () => __awaiter(this, void 0, void 0, function* () {
            // Synchronize date/time
            // const start = Date.now(); // performance.now();
            const info = yield this.api.getServerInfo();
            const now = Date.now(), 
            // roundtrip = now - start, //performance.now() - start,
            // expectedTime = now - Math.floor(roundtrip / 2),
            // bias = info.time - expectedTime;
            bias = info.time - now;
            (0, server_date_1.setServerBias)(bias);
        });
        this.on('connect', () => {
            // Disable cache db's ipc events, we are already notified of data changes by the server (prevents double event callbacks)
            if (cacheDb && 'settings' in cacheDb) {
                cacheDb.settings.ipcEvents = false;
            }
            synchronizeClocks();
        });
        this.on('disconnect', () => {
            // Enable cache db's ipc events, so we get event notifications of changes by other ipc peers while offline
            if (cacheDb && 'settings' in cacheDb) {
                cacheDb.settings.ipcEvents = true;
            }
        });
        this.sync = () => __awaiter(this, void 0, void 0, function* () {
            const result = yield syncPendingChanges(true);
            return result;
        });
        let syncRunning = false, firstSync = true;
        const syncPendingChanges = (throwErrors = false) => __awaiter(this, void 0, void 0, function* () {
            if (syncRunning) {
                // Already syncing
                if (throwErrors) {
                    throw new Error('sync already running');
                }
                return;
            }
            if (!this.api.isConnected) {
                // We'll retry once connected
                // // Do set firstSync to false, this fixes the issue of the first sync firing after
                // // an initial succesful connection, but quick disconnect (sync does not run)
                // // and later reconnect --> Fresh data needs to be loaded
                // firstSync = false;
                if (throwErrors) {
                    throw new Error('not connected');
                }
                return;
            }
            syncRunning = true;
            try {
                yield cacheReadyPromise;
                return yield this.api.sync({
                    firstSync,
                    fetchFreshData: !firstSync,
                    eventCallback: (eventName, args) => {
                        this.debug.log(eventName, args || '');
                        this.emit(eventName, args); // this.emit('cache_sync_event', { name: eventName, args });
                    },
                });
            }
            catch (err) {
                // Sync failed for some reason
                if (throwErrors) {
                    throw err;
                }
                else {
                    console.error(`Failed to synchronize:`, err);
                }
            }
            finally {
                syncRunning = false;
                firstSync = false;
            }
        });
        let syncTimeout;
        this.on('connect', () => {
            if (settings.sync.timing === 'connect' || (settings.sync.timing === 'signin' && this.auth.accessToken)) {
                syncPendingChanges();
            }
            else if (settings.sync.timing === 'auto') {
                syncTimeout && clearTimeout(syncTimeout);
                syncTimeout = setTimeout(syncPendingChanges, 2500); // Start sync with a short delay to allow client to sign in first
            }
        });
        this.on('signin', () => {
            if (settings.sync.timing === 'auto') {
                syncTimeout && clearTimeout(syncTimeout);
            }
            if (['auto', 'signin'].includes(settings.sync.timing)) {
                syncPendingChanges();
            }
        });
        const emitClientReady = () => __awaiter(this, void 0, void 0, function* () {
            if (cacheDb) {
                yield cacheDb.ready();
            }
            this.emit('ready');
        });
        this.api = new api_web_1.WebApi(settings.dbname, {
            network: settings.network,
            sync: settings.sync,
            logLevel: settings.logLevel,
            autoConnect: settings.autoConnect,
            autoConnectDelay: settings.autoConnectDelay,
            cache: settings.cache,
            debug: this.debug,
            url: `http${settings.https ? 's' : ''}://${settings.host}:${settings.port}`,
        }, (evt, data) => {
            if (evt === 'connect') {
                this.emit('connect');
                if (!ready) {
                    emitClientReady();
                }
            }
            else if (evt === 'connect_error') {
                this.emit('connect_error', data);
                if (!ready && cacheDb) { // If cache db is used, we can work without connection
                    emitClientReady();
                }
            }
            else if (evt === 'disconnect') {
                this.emit('disconnect');
            }
        });
        this.auth = new auth_1.AceBaseClientAuth(this, (event, arg) => {
            this.emit(event, arg);
        });
    }
    sync() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Must be set by constructor');
        });
    }
    get connected() {
        return this.api.isConnected;
    }
    get connectionState() {
        return this.api.connectionState;
    }
    connect() {
        return this.api.connect();
    }
    disconnect() {
        this.api.disconnect();
    }
    close() {
        this.disconnect();
    }
    callExtension(method, path, data) {
        return this.api.callExtension(method, path, data);
    }
    /**
     * Gets the current sync cursor
     */
    getCursor() {
        return this.api.getSyncCursor();
    }
    /**
     * Sets the sync cursor to use
     */
    setCursor(cursor) {
        this.api.setSyncCursor(cursor);
    }
    get cache() {
        /**
         * Clears the entire cache, or a specific path without raising any events
         */
        const clear = (path = '') => __awaiter(this, void 0, void 0, function* () {
            yield this.api.clearCache(path);
        });
        /**
         * Updates the local cache with remote changes by retrieving all changes to `path` since given `cursor` and applying them to the local cache database.
         * If the local path does not exist or no cursor is given, its entire value will be loaded from the server and stored in cache. If no cache database is used, an error will be thrown.
         * @param path Path to update. The root path will be used if not given, synchronizing the entire database.
         * @param cursor A previously achieved cursor to update with. Path's entire value will be loaded from the server if not given.
         */
        const update = (path = '', cursor) => {
            return this.api.updateCache(path, cursor);
        };
        /**
         * Loads a value from cache database.If a cursor is provided, the cache will be updated with remote changes
         * first. If the value is not available in cache, it will be loaded from the server and stored in cache.
         * This method is a shortcut for common cache logic provided by `db.ref(path).get` with the `cache_mode`
         * and `cache_cursor` options.
         * @param path target path to load
         * @param cursor A previously acquired cursor
         * @returns Returns a Promise that resolves with a snapshot of the value
         */
        const get = (path, cursor) => __awaiter(this, void 0, void 0, function* () {
            // Update the cache with provided cursor
            const options = Object.freeze(cursor ? { cache_mode: 'allow', cache_cursor: cursor } : { cache_mode: 'force' });
            const snap = yield this.ref(path).get(options);
            return snap;
        });
        return { clear, update, get };
    }
}
exports.AceBaseClient = AceBaseClient;

},{"./api-web":2,"./auth":3,"./server-date":12,"acebase-core":30}],2:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebApi = void 0;
const acebase_core_1 = require("acebase-core");
const socket_io_client_1 = require("socket.io-client");
const Base64 = require("./base64");
const error_1 = require("./request/error");
const errors_1 = require("./errors");
const promise_timeout_1 = require("./promise-timeout");
const request_1 = require("./request");
const _websocketRequest = (socket, event, data, accessToken) => {
    if (!socket) {
        throw new Error(`Cannot send request because websocket connection is not open`);
    }
    const requestId = acebase_core_1.ID.generate();
    // const request = data;
    // request.req_id = requestId;
    // request.access_token = accessToken;
    const request = Object.assign(Object.assign({}, data), { req_id: requestId, access_token: accessToken });
    return new Promise((resolve, reject) => {
        if (!socket) {
            return reject(new error_1.AceBaseRequestError(request, null, 'websocket', 'No open websocket connection'));
        }
        let timeout;
        const send = (retry = 0) => {
            socket.emit(event, request);
            timeout = setTimeout(() => {
                if (retry < 2) {
                    return send(retry + 1);
                }
                socket.off('result', handle);
                const err = new error_1.AceBaseRequestError(request, null, 'timeout', `Server did not respond to "${event}" request after ${retry + 1} tries`);
                reject(err);
            }, 1000);
        };
        const handle = (response) => {
            if (response.req_id === requestId) {
                clearTimeout(timeout);
                socket.off('result', handle);
                if (response.success) {
                    return resolve(response);
                }
                // Access denied?
                const code = typeof response.reason === 'object' ? response.reason.code : response.reason;
                const message = typeof response.reason === 'object' ? response.reason.message : `request failed: ${code}`;
                const err = new error_1.AceBaseRequestError(request, response, code, message);
                reject(err);
            }
        };
        socket.on('result', handle);
        send();
    });
};
/**
 * TODO: Find out if we can use acebase-core's EventSubscription, extended with some properties
 */
class EventSubscription {
    constructor(path, event, callback, settings) {
        this.path = path;
        this.event = event;
        this.callback = callback;
        this.settings = settings;
        this.state = 'requested';
        this.added = Date.now();
        this.activated = 0;
        this.lastEvent = 0;
        this.lastSynced = 0;
        this.cursor = null;
        this.cacheCallback = null;
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
// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => { };
/**
 * Api to connect to a remote AceBase server over http(s)
 */
class WebApi extends acebase_core_1.Api {
    constructor(dbname = 'default', settings, callback) {
        // operations are done through http calls,
        // events are triggered through a websocket
        super();
        this.dbname = dbname;
        this.settings = settings;
        this._id = acebase_core_1.ID.generate(); // For mutation contexts, not using websocket client id because that might cause security issues
        this.socket = null;
        this._serverVersion = 'unknown';
        this._cursor = {
            /** Last cursor received by the server */
            current: null,
            /** Last cursor received before client went offline, will be used for sync. */
            sync: null,
        };
        this._eventTimeline = { init: Date.now(), connect: 0, signIn: 0, sync: 0, disconnect: 0 };
        this._subscriptions = {};
        this._realtimeQueries = {};
        this.accessToken = null;
        this.manualConnectionMonitor = new acebase_core_1.SimpleEventEmitter();
        this._id = acebase_core_1.ID.generate(); // For mutation contexts, not using websocket client id because that might cause security issues
        this._autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this._autoConnectDelay = typeof settings.autoConnectDelay === 'number' ? settings.autoConnectDelay : 0;
        this._connectionState = CONNECTION_STATE_DISCONNECTED;
        if (settings.cache.enabled !== false) {
            this._cache = {
                db: settings.cache.db,
                priority: settings.cache.priority,
            };
        }
        if (settings.network.monitor) {
            // Mobile devices might go offline while the app is suspended (running in the backgound)
            // no events will fire and when the app resumes, it might assume it is still connected while
            // it is not. We'll manually poll the server to check the connection
            const interval = setInterval(() => this.checkConnection(), settings.network.interval * 1000); // ping every x seconds
            interval.unref && interval.unref();
        }
        this.debug = settings.debug;
        this.eventCallback = (event, ...args) => {
            if (event === 'disconnect') {
                this._cursor.sync = this._cursor.current;
            }
            callback && callback(event, ...args);
        };
        if (this._autoConnect) {
            if (this._autoConnectDelay) {
                setTimeout(() => this.connect().catch(NOOP), this._autoConnectDelay);
            }
            else {
                this.connect().catch(NOOP);
            }
        }
    }
    /**
     * Allow cursor used for synchronization to be changed. Should only be done while not connected.
     */
    setSyncCursor(cursor) {
        this._cursor.sync = cursor;
    }
    getSyncCursor() {
        return this._cursor.sync;
    }
    get url() { return this.settings.url; }
    _updateCursor(cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!cursor || (this._cursor.current && cursor < this._cursor.current)) {
                return; // Just in case this ever happens, ignore events with earlier cursors.
            }
            this._cursor.current = cursor;
        });
    }
    get hasCache() { return !!this._cache; }
    get cache() {
        if (!this._cache) {
            throw new Error('DEV ERROR: no cache db is used');
        }
        return this._cache;
    }
    checkConnection() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Websocket connection is used
            if (((_a = this.settings.network) === null || _a === void 0 ? void 0 : _a.realtime) && !this.isConnected) {
                // socket.io handles reconnects, we don't have to monitor
                return;
            }
            if (!((_b = this.settings.network) === null || _b === void 0 ? void 0 : _b.realtime) && ![CONNECTION_STATE_CONNECTING, CONNECTION_STATE_CONNECTED].includes(this._connectionState)) {
                // No websocket connection. Do not check if we're not connecting or connected
                return;
            }
            const wasConnected = this.isConnected;
            try {
                // Websocket is connected (or realtime is not used), check connectivity to server by sending http/s ping
                yield this._request({ url: this.serverPingUrl, ignoreConnectionState: true });
                if (!wasConnected) {
                    this.manualConnectionMonitor.emit('connect');
                }
            }
            catch (err) {
                // No need to handle error here, _request will have handled the disconnect by calling this._handleDetectedDisconnect
            }
        });
    }
    _handleDetectedDisconnect(err) {
        var _a;
        if ((_a = this.settings.network) === null || _a === void 0 ? void 0 : _a.realtime) {
            // Launch reconnect flow by recycling the websocket
            this._connectionState === CONNECTION_STATE_DISCONNECTED;
            this.connect().catch(NOOP);
            // console.assert(this._connectionState === CONNECTION_STATE_CONNECTING, 'wrong connection state');
        }
        else {
            if (this._connectionState === CONNECTION_STATE_CONNECTING) {
                this.manualConnectionMonitor.emit('connect_error', err);
            }
            else if (this._connectionState === CONNECTION_STATE_CONNECTED) {
                this.manualConnectionMonitor.emit('disconnect');
            }
        }
    }
    connect() {
        var _a;
        if (this.socket !== null && typeof this.socket === 'object') {
            this.disconnect();
        }
        this._connectionState = CONNECTION_STATE_CONNECTING;
        this.debug.log(`Connecting to AceBase server "${this.url}"`);
        if (!this.url.startsWith('https')) {
            this.debug.warn(`WARNING: The server you are connecting to does not use https, any data transferred may be intercepted!`.colorize(acebase_core_1.ColorStyle.red));
        }
        // Change default socket.io (engine.io) transports setting of ['polling', 'websocket']
        // We should only use websocket (it's almost 2022!), because if an AceBaseServer is running in a cluster,
        // polling should be disabled entirely because the server is not stateless: the client might reach
        // a different node on a next long-poll connection.
        // For backward compatibility the transports setting is allowed to be overriden with a setting:
        const transports = ((_a = this.settings.network) === null || _a === void 0 ? void 0 : _a.transports) instanceof Array
            ? this.settings.network.transports
            : ['websocket'];
        this.debug.log(`Using ${transports.join(',')} transport${transports.length > 1 ? 's' : ''} for socket.io`);
        return new Promise((resolve, reject) => {
            var _a;
            if (!((_a = this.settings.network) === null || _a === void 0 ? void 0 : _a.realtime)) {
                // New option: not using websocket connection. Check if we can reach the server.
                // Make sure any previously attached events are removed
                this.manualConnectionMonitor.off('connect');
                this.manualConnectionMonitor.off('connect_error');
                this.manualConnectionMonitor.off('disconnect');
                this.manualConnectionMonitor.on('connect', () => {
                    this._connectionState = CONNECTION_STATE_CONNECTED;
                    this._eventTimeline.connect = Date.now();
                    this.manualConnectionMonitor.off('connect_error'); // prevent connect_error to fire after a successful connect
                    this.eventCallback('connect');
                    resolve();
                });
                this.manualConnectionMonitor.on('connect_error', (err) => {
                    // New connection failed to establish. Attempts will be made to reconnect, but fail for now
                    this.debug.error(`API connection error: ${err.message || err}`);
                    this.eventCallback('connect_error', err);
                    reject(err);
                });
                this.manualConnectionMonitor.on('disconnect', () => {
                    // Existing connection was broken, by us or network
                    if (this._connectionState === CONNECTION_STATE_DISCONNECTING) {
                        // Disconnect was requested by us: reason === 'client namespace disconnect'
                        this._connectionState = CONNECTION_STATE_DISCONNECTED;
                        // Remove event listeners
                        this.manualConnectionMonitor.off('connect');
                        this.manualConnectionMonitor.off('disconnect');
                        this.manualConnectionMonitor.off('connect_error');
                    }
                    else {
                        // Disconnect was not requested.
                        this._connectionState = CONNECTION_STATE_CONNECTING;
                        this._eventTimeline.disconnect = Date.now();
                    }
                    this.eventCallback('disconnect');
                });
                this._connectionState = CONNECTION_STATE_CONNECTING;
                return setTimeout(() => this.checkConnection(), 0);
            }
            const socket = this.socket = (0, socket_io_client_1.connect)(this.url, {
                // Use default socket.io connection settings:
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                randomizationFactor: 0.5,
                transports, // Override default setting of ['polling', 'websocket']
            });
            socket.on('connect_error', err => {
                // New connection failed to establish. Attempts will be made to reconnect, but fail for now
                this.debug.error(`Websocket connection error: ${err}`);
                this.eventCallback('connect_error', err);
                reject(err);
            });
            socket.on('connect', () => __awaiter(this, void 0, void 0, function* () {
                this._connectionState = CONNECTION_STATE_CONNECTED;
                this._eventTimeline.connect = Date.now();
                if (this.accessToken) {
                    // User must be signed in again (NOTE: this does not emit the "signin" event if the user was signed in before)
                    const isFirstSignIn = this._eventTimeline.signIn === 0;
                    try {
                        yield this.signInWithToken(this.accessToken, isFirstSignIn);
                    }
                    catch (err) {
                        this.debug.error(`Could not automatically sign in user with access token upon reconnect: ${err.code || err.message}`);
                    }
                }
                const subscribeTo = (sub) => __awaiter(this, void 0, void 0, function* () {
                    // Function is called for each unique path/event combination
                    // We must activate or cancel all subscriptions with this combination
                    const subs = this._subscriptions[sub.path].filter(s => s.event === sub.event);
                    try {
                        const result = yield _websocketRequest(this.socket, 'subscribe', { path: sub.path, event: sub.event }, this.accessToken);
                        subs.forEach(s => s.activate());
                    }
                    catch (err) {
                        if (err.code === 'access_denied' && !this.accessToken) {
                            this.debug.error(`Could not subscribe to event "${sub.event}" on path "${sub.path}" because you are not signed in. If you added this event while offline and have a user access token, you can prevent this by using client.auth.setAccessToken(token) to automatically try signing in after connecting`);
                        }
                        else {
                            this.debug.error(err);
                        }
                        subs.forEach(s => s.cancel(err));
                    }
                });
                // (re)subscribe to any active subscriptions
                const subscribePromises = [];
                Object.keys(this._subscriptions).forEach(path => {
                    const events = [];
                    this._subscriptions[path].forEach(sub => {
                        if (sub.event === 'mutated') {
                            return;
                        } // Skip mutated events for now
                        const serverAlreadyNotifying = events.includes(sub.event);
                        if (!serverAlreadyNotifying) {
                            events.push(sub.event);
                            const promise = subscribeTo(sub);
                            subscribePromises.push(promise);
                        }
                    });
                });
                // Now, subscribe to all top path mutated events
                const subscribeToMutatedEvents = () => __awaiter(this, void 0, void 0, function* () {
                    let retry = false;
                    const promises = Object.keys(this._subscriptions)
                        .filter(path => this._subscriptions[path].some(sub => sub.event === 'mutated' && sub.state !== 'canceled'))
                        .filter((path, i, arr) => !arr.some(otherPath => acebase_core_1.PathInfo.get(otherPath).isAncestorOf(path)))
                        .reduce((topPaths, path) => (topPaths.includes(path) || topPaths.push(path)) && topPaths, [])
                        .map(topEventPath => {
                        const sub = this._subscriptions[topEventPath].find(s => s.event === 'mutated');
                        const promise = subscribeTo(sub).then(() => {
                            if (sub.state === 'canceled') {
                                // Oops, could not subscribe to 'mutated' event on topEventPath, other event(s) at child path(s) should now take over
                                retry = true;
                            }
                        });
                        return promise;
                    });
                    yield Promise.all(promises);
                    if (retry) {
                        yield subscribeToMutatedEvents();
                    }
                });
                subscribePromises.push(subscribeToMutatedEvents());
                yield Promise.all(subscribePromises);
                this.eventCallback('connect'); // Safe to let client know we're connected
                resolve(); // Resolve the .connect() promise
            }));
            socket.on('disconnect', reason => {
                this.debug.warn(`Websocket disconnected: ${reason}`);
                // Existing connection was broken, by us or network
                if (this._connectionState === CONNECTION_STATE_DISCONNECTING) {
                    // disconnect was requested by us: reason === 'client namespace disconnect'
                    this._connectionState = CONNECTION_STATE_DISCONNECTED;
                }
                else {
                    // Automatic reconnect should be done by socket.io
                    this._connectionState = CONNECTION_STATE_CONNECTING;
                    this._eventTimeline.disconnect = Date.now();
                    if (reason === 'io server disconnect') {
                        // if the server has shut down and disconnected all clients, we have to reconnect manually
                        this.socket = null;
                        this.connect().catch(err => {
                            // Immediate reconnect failed, which is ok.
                            // socket.io will retry now
                        });
                    }
                }
                this.eventCallback('disconnect');
            });
            socket.on('data-event', data => {
                var _a;
                const val = acebase_core_1.Transport.deserialize(data.val);
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
                const causedByUs = ((_a = context.acebase_mutation) === null || _a === void 0 ? void 0 : _a.client_id) === this._id;
                const cacheEnabled = this.hasCache; //!!this._cache?.db;
                const fireThisEvent = !causedByUs || !cacheEnabled;
                const updateCache = !causedByUs && cacheEnabled;
                const fireCacheEvents = false; // See above flow documentation
                // console.log(`${this._cache ? `[${this._cache.db.api.storage.name}] ` : ''}Received data event "${data.event}" on path "${data.path}":`, val);
                // console.log(`Received data event "${data.event}" on path "${data.path}":`, val);
                const pathSubs = this._subscriptions[data.subscr_path];
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
                            const path = m.target.reduce((path, key) => acebase_core_1.PathInfo.getChildPath(path, key), acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, data.path));
                            this.cache.db.api.set(path, m.val, { suppress_events: !fireCacheEvents, context });
                        });
                    }
                    else if (data.event === 'notify_child_removed') {
                        this.cache.db.api.set(acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, data.path), null, { suppress_events: !fireCacheEvents, context }); // Remove cached value
                    }
                    else if (!data.event.startsWith('notify_')) {
                        this.cache.db.api.set(acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, data.path), val.current, { suppress_events: !fireCacheEvents, context }); // Update cached value
                    }
                }
                if (!fireThisEvent) {
                    return;
                }
                // The cache db will not have fired any events (const fireCacheEvents = false), so we can fire them here now.
                const targetSubs = data.event === 'mutated'
                    ? Object.keys(this._subscriptions)
                        .filter(path => {
                        const pathInfo = acebase_core_1.PathInfo.get(path);
                        return path === data.path || pathInfo.equals(data.subscr_path) || pathInfo.isAncestorOf(data.path);
                    })
                        .reduce((subs, path) => {
                        const add = this._subscriptions[path].filter(sub => sub.event === 'mutated');
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
            socket.on('query-event', data => {
                data = acebase_core_1.Transport.deserialize(data);
                const query = this._realtimeQueries[data.query_id];
                let keepMonitoring = true;
                try {
                    keepMonitoring = query.options.eventHandler(data);
                }
                catch (err) {
                    keepMonitoring = false;
                }
                if (keepMonitoring === false) {
                    delete this._realtimeQueries[data.query_id];
                    socket.emit('query-unsubscribe', { query_id: data.query_id });
                }
            });
        });
    }
    disconnect() {
        var _a;
        if (!((_a = this.settings.network) === null || _a === void 0 ? void 0 : _a.realtime)) {
            // No websocket connectino is used
            this._connectionState = CONNECTION_STATE_DISCONNECTING;
            this._eventTimeline.disconnect = Date.now();
            this.manualConnectionMonitor.emit('disconnect');
        }
        else if (this.socket !== null && typeof this.socket === 'object') {
            this._connectionState = CONNECTION_STATE_DISCONNECTING;
            this._eventTimeline.disconnect = Date.now();
            this.socket.disconnect();
            this.socket = null;
        }
    }
    subscribe(path, event, callback, settings) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.settings.network) === null || _a === void 0 ? void 0 : _a.realtime)) {
                throw new Error(`Cannot subscribe to realtime events because it has been disabled in the network settings`);
            }
            let pathSubs = this._subscriptions[path];
            if (!pathSubs) {
                pathSubs = this._subscriptions[path] = [];
            }
            const serverAlreadyNotifying = pathSubs.some(sub => sub.event === event)
                || (event === 'mutated' && Object.keys(this._subscriptions).some(otherPath => acebase_core_1.PathInfo.get(otherPath).isAncestorOf(path) && this._subscriptions[otherPath].some(sub => sub.event === event && sub.state === 'active')));
            const subscr = new EventSubscription(path, event, callback, settings);
            // { path, event, callback, settings, added: Date.now(), activate() { this.activated = Date.now() }, activated: null, lastEvent: null, cursor: null };
            pathSubs.push(subscr);
            if (this.hasCache) {
                // Events are also handled by cache db
                subscr.cacheCallback = (err, path, newValue, oldValue, context) => subscr.callback(err, path.slice(`${this.dbname}/cache/`.length), newValue, oldValue, context);
                this.cache.db.api.subscribe(acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path), event, subscr.cacheCallback);
            }
            if (serverAlreadyNotifying || !this.isConnected) {
                // If we're offline, the event will be subscribed once connected
                return;
            }
            if (event === 'mutated') {
                // Unsubscribe from 'mutated' events set on descendant paths of current path
                Object.keys(this._subscriptions)
                    .filter(otherPath => acebase_core_1.PathInfo.get(otherPath).isDescendantOf(path)
                    && this._subscriptions[otherPath].some(sub => sub.event === 'mutated'))
                    .map(path => _websocketRequest(this.socket, 'unsubscribe', { path, event: 'mutated' }, this.accessToken))
                    .map(promise => promise.catch(err => console.error(err)));
            }
            const result = yield _websocketRequest(this.socket, 'subscribe', { path, event }, this.accessToken);
            subscr.activate();
        });
    }
    unsubscribe(path, event, callback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.settings.network) === null || _a === void 0 ? void 0 : _a.realtime)) {
                throw new Error(`Cannot unsubscribe from realtime events because it has been disabled in the network settings`);
            }
            const pathSubs = this._subscriptions[path];
            if (!pathSubs) {
                return Promise.resolve();
            }
            const unsubscribeFrom = (subscriptions) => {
                subscriptions.forEach(subscr => {
                    pathSubs.splice(pathSubs.indexOf(subscr), 1);
                    if (this.hasCache) {
                        // Events are also handled by cache db, also remove those
                        if (typeof subscr.cacheCallback !== 'undefined') {
                            throw new Error('DEV ERROR: When subscription was added, cacheCallback must have been set');
                        }
                        this.cache.db.api.unsubscribe(acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path), subscr.event, subscr.cacheCallback);
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
                delete this._subscriptions[path];
                if (this.isConnected) {
                    promise = _websocketRequest(this.socket, 'unsubscribe', { path, access_token: this.accessToken }, this.accessToken)
                        .catch(err => this.debug.error(`Failed to unsubscribe from event(s) on "${path}": ${err.message}`));
                }
            }
            else if (this.isConnected && !pathSubs.some(subscr => subscr.event === event)) {
                // No callbacks left for specific event
                promise = _websocketRequest(this.socket, 'unsubscribe', { path: path, event, access_token: this.accessToken }, this.accessToken)
                    .catch(err => this.debug.error(`Failed to unsubscribe from event "${event}" on "${path}": ${err.message}`));
            }
            if (this.isConnected && hadMutatedEvents && !hasMutatedEvents) {
                // If any descendant paths have mutated events, resubscribe those
                const promises = Object.keys(this._subscriptions)
                    .filter(otherPath => acebase_core_1.PathInfo.get(otherPath).isDescendantOf(path) && this._subscriptions[otherPath].some(sub => sub.event === 'mutated'))
                    .map(path => _websocketRequest(this.socket, 'subscribe', { path: path, event: 'mutated' }, this.accessToken))
                    .map(promise => promise.catch(err => this.debug.error(`Failed to subscribe to event "${event}" on path "${path}": ${err.message}`)));
                promise = Promise.all([promise, ...promises]);
            }
            yield promise;
        });
    }
    transaction(path, callback, options = { context: {} }) {
        const id = acebase_core_1.ID.generate();
        options.context = options.context || {};
        // TODO: reduce this contextual overhead to 'client_id' only, or additional debugging info upon request
        options.context.acebase_mutation = {
            client_id: this._id,
            id,
            op: 'transaction',
            path,
            flow: 'server',
        };
        const cachePath = acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path);
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            let cacheUpdateVal;
            const handleSuccess = (context) => __awaiter(this, void 0, void 0, function* () {
                if (this.hasCache && typeof cacheUpdateVal !== 'undefined') {
                    // Update cache db value
                    yield this.cache.db.api.set(cachePath, cacheUpdateVal);
                }
                resolve({ cursor: context === null || context === void 0 ? void 0 : context.acebase_cursor });
            });
            if (this.isConnected && ((_a = this.settings.network) === null || _a === void 0 ? void 0 : _a.realtime)) {
                // Use websocket connection
                const socket = this.socket;
                const startedCallback = (data) => __awaiter(this, void 0, void 0, function* () {
                    if (data.id === id) {
                        socket.off('tx_started', startedCallback);
                        const currentValue = acebase_core_1.Transport.deserialize(data.value);
                        let newValue = callback(currentValue);
                        if (newValue instanceof Promise) {
                            newValue = yield newValue;
                        }
                        socket.emit('transaction', { action: 'finish', id: id, path, value: acebase_core_1.Transport.serialize(newValue), access_token: this.accessToken });
                        if (this.hasCache) {
                            cacheUpdateVal = newValue;
                        }
                    }
                });
                const completedCallback = (data) => {
                    if (data.id === id) {
                        socket.off('tx_completed', completedCallback);
                        socket.off('tx_error', errorCallback);
                        handleSuccess(data.context);
                    }
                };
                const errorCallback = (data) => {
                    if (data.id === id) {
                        socket.off('tx_started', startedCallback);
                        socket.off('tx_completed', completedCallback);
                        socket.off('tx_error', errorCallback);
                        reject(new Error(data.reason));
                    }
                };
                socket.on('tx_started', startedCallback);
                socket.on('tx_completed', completedCallback);
                socket.on('tx_error', errorCallback);
                // TODO: socket.on('disconnect', disconnectedCallback);
                socket.emit('transaction', { action: 'start', id, path, access_token: this.accessToken, context: options.context });
            }
            else {
                // Websocket not connected. Try http call instead
                const startData = JSON.stringify({ path });
                try {
                    const tx = yield this._request({ ignoreConnectionState: true, method: 'POST', url: `${this.url}/transaction/${this.dbname}/start`, data: startData, context: options.context });
                    const id = tx.id;
                    const currentValue = acebase_core_1.Transport.deserialize(tx.value);
                    let newValue = callback(currentValue);
                    if (newValue instanceof Promise) {
                        newValue = yield newValue;
                    }
                    if (this.hasCache) {
                        cacheUpdateVal = newValue;
                    }
                    const finishData = JSON.stringify({ id, value: acebase_core_1.Transport.serialize(newValue) });
                    const { context } = yield this._request({ ignoreConnectionState: true, method: 'POST', url: `${this.url}/transaction/${this.dbname}/finish`, data: finishData, context: options.context, includeContext: true });
                    yield handleSuccess(context);
                }
                catch (err) {
                    if (['ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'fetch_failed'].includes(err.code)) {
                        err.message = error_1.NOT_CONNECTED_ERROR_MESSAGE;
                    }
                    reject(err);
                }
            }
        }));
    }
    /**
     * @returns returns a promise that resolves with the returned data, or (when options.includeContext === true) an object containing data and returned context
     */
    _request(options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected || options.ignoreConnectionState === true) {
                const result = yield (() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        return yield (0, request_1.default)(options.method || 'GET', options.url, { data: options.data, accessToken: this.accessToken, dataReceivedCallback: options.dataReceivedCallback, dataRequestCallback: options.dataRequestCallback, context: options.context });
                    }
                    catch (err) {
                        if (this.isConnected && err.isNetworkError) {
                            // This is a network error, but the websocket thinks we are still connected.
                            this.debug.warn(`A network error occurred loading ${options.url}`);
                            // Start reconnection flow
                            this._handleDetectedDisconnect(err);
                        }
                        // Rethrow the error
                        throw err;
                    }
                }))();
                if (result.context && result.context.acebase_cursor) {
                    this._updateCursor(result.context.acebase_cursor);
                }
                if (options.includeContext === true) {
                    if (!result.context) {
                        result.context = {};
                    }
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
                if (!this.isConnecting || !((_a = this.settings.network) === null || _a === void 0 ? void 0 : _a.realtime)) {
                    // We're currently not trying to connect, or not using websocket connection (normal connection logic is still used).
                    // Fail now
                    throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
                }
                const connectPromise = new Promise(resolve => { var _a; return (_a = this.socket) === null || _a === void 0 ? void 0 : _a.once('connect', resolve); });
                yield (0, promise_timeout_1.promiseTimeout)(connectPromise, 1000, 'Waiting for connection').catch(err => {
                    throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
                });
                return this._request(options); // Retry
            }
        });
    }
    handleSignInResult(result, emitEvent = true) {
        var _a;
        this._eventTimeline.signIn = Date.now();
        const details = { user: result.user, accessToken: result.access_token, provider: result.provider || 'acebase' };
        this.accessToken = details.accessToken;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.emit('signin', details.accessToken); // Make sure the connected websocket server knows who we are as well.
        emitEvent && this.eventCallback('signin', details);
        return details;
    }
    signIn(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'account', username, password, client_id: this.socket && this.socket.id } });
            return this.handleSignInResult(result);
        });
    }
    signInWithEmail(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'email', email, password, client_id: this.socket && this.socket.id } });
            return this.handleSignInResult(result);
        });
    }
    signInWithToken(token, emitEvent = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error('Cannot sign in because client is not connected to the server. If you want to automatically sign in the user with this access token once a connection is established, use client.auth.setAccessToken(token)');
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'token', access_token: token, client_id: this.socket && this.socket.id } });
            return this.handleSignInResult(result, emitEvent);
        });
    }
    setAccessToken(token) {
        this.accessToken = token;
    }
    startAuthProviderSignIn(providerName, callbackUrl, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const optionParams = typeof options === 'object'
                ? '&' + Object.keys(options).map(key => `option_${key}=${encodeURIComponent(options[key])}`).join('&')
                : '';
            const result = yield this._request({ url: `${this.url}/oauth2/${this.dbname}/init?provider=${providerName}&callbackUrl=${callbackUrl}${optionParams}` });
            return { redirectUrl: result.redirectUrl };
        });
    }
    finishAuthProviderSignIn(callbackResult) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            try {
                result = JSON.parse(Base64.decode(callbackResult));
            }
            catch (err) {
                throw new Error(`Invalid result`);
            }
            if (!result.user) {
                // AceBaseServer 1.9.0+ does not include user details in the redirect.
                // We must get (and validate) auth state with received access token
                this.accessToken = result.access_token;
                const authState = yield this._request({ url: `${this.url}/auth/${this.dbname}/state` });
                if (!authState.signed_in) {
                    this.accessToken = null;
                    throw new Error(`Invalid access token received: not signed in`);
                }
                result.user = authState.user;
            }
            return this.handleSignInResult(result);
        });
    }
    refreshAuthProviderToken(providerName, refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ url: `${this.url}/oauth2/${this.dbname}/refresh?provider=${providerName}&refresh_token=${refreshToken}` });
            return result;
        });
    }
    signOut(options = {
        everywhere: false,
        clearCache: false,
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options === 'boolean') {
                // Old signature signOut(everywhere:boolean = false)
                options = { everywhere: options };
            }
            else if (typeof options !== 'object') {
                throw new TypeError('options must be an object');
            }
            if (typeof options.everywhere !== 'boolean') {
                options.everywhere = false;
            }
            if (typeof options.clearCache !== 'boolean') {
                options.clearCache = false;
            }
            if (!this.accessToken) {
                return;
            }
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/signout`, data: { client_id: this.socket && this.socket.id, everywhere: options.everywhere } });
            this.socket && this.socket.emit('signout', this.accessToken); // Make sure the connected websocket server knows we signed out as well.
            this.accessToken = null;
            if (this.hasCache && options.clearCache) {
                // Clear cache, but don't wait for it to finish
                this.clearCache().catch(err => {
                    console.error(`Could not clear cache:`, err);
                });
            }
            this.eventCallback('signout');
        });
    }
    changePassword(uid, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.accessToken) {
                throw new Error(`not_signed_in`);
            }
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/change_password`, data: { uid, password: currentPassword, new_password: newPassword } });
            this.accessToken = result.access_token;
            return { accessToken: this.accessToken };
        });
    }
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/forgot_password`, data: { email } });
            return result;
        });
    }
    verifyEmailAddress(verificationCode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/verify_email`, data: { code: verificationCode } });
            return result;
        });
    }
    resetPassword(resetCode, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/reset_password`, data: { code: resetCode, password: newPassword } });
            return result;
        });
    }
    signUp(details, signIn = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/signup`, data: details });
            if (signIn) {
                return this.handleSignInResult(result);
            }
            return { user: result.user, accessToken: this.accessToken };
        });
    }
    updateUserDetails(details) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/update`, data: details });
            return { user: result.user };
        });
    }
    deleteAccount(uid, signOut = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            const result = yield this._request({ method: 'POST', url: `${this.url}/auth/${this.dbname}/delete`, data: { uid } });
            if (signOut) {
                this.socket && this.socket.emit('signout', this.accessToken);
                this.accessToken = null;
                this.eventCallback('signout');
            }
            return true;
        });
    }
    get isConnected() {
        return this._connectionState === CONNECTION_STATE_CONNECTED;
    }
    get isConnecting() {
        return this._connectionState === CONNECTION_STATE_CONNECTING;
    }
    get connectionState() {
        return this._connectionState;
    }
    stats(options = undefined) {
        return this._request({ url: `${this.url}/stats/${this.dbname}` });
    }
    sync(options = {
        firstSync: false,
        fetchFreshData: true,
        eventCallback: null,
    }) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            // Sync cache
            if (!this.isConnected) {
                throw new Error(error_1.NOT_CONNECTED_ERROR_MESSAGE);
            }
            if (this.hasCache && !this.cache.db.isReady) {
                throw new Error(`cache database is not ready yet`);
            }
            this._eventTimeline.sync = Date.now();
            (_a = options.eventCallback) === null || _a === void 0 ? void 0 : _a.call(options, 'sync_start');
            const handleStatsUpdateError = (err) => {
                this.debug.error(`Failed to update cache db stats:`, err);
            };
            try {
                let totalPendingChanges = 0;
                const useCursor = ((_b = this.settings.sync) === null || _b === void 0 ? void 0 : _b.useCursor) !== false;
                const cursor = useCursor ? this._cursor.sync : null;
                if (this.hasCache) {
                    // Part 1: PUSH local changes
                    const cacheApi = this.cache.db.api;
                    const { value, context } = yield cacheApi.get(`${this.dbname}/pending`);
                    const pendingChanges = value;
                    cacheApi.set(`${this.dbname}/stats/last_sync_start`, new Date()).catch(handleStatsUpdateError);
                    try {
                        const ids = Object.keys(pendingChanges || {}).sort(); // sort a-z, process oldest mutation first
                        const compatibilityMode = ids.map(id => pendingChanges[id]).some(m => m.type === 'update');
                        const mutations = compatibilityMode
                            ? ids.map(id => {
                                // If any "update" mutations are in the db, these are old mutations. Process them unaltered. This is for backward compatibility only, can be removed later. (if code was able to update, mutations could have already been synced too, right?)
                                const mutation = pendingChanges[id];
                                mutation.ids = [id];
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
                                    if (rootUpdate) {
                                        rootUpdate.data = change.data;
                                    }
                                    else {
                                        change.ids = [id];
                                        mutations.push(change);
                                    }
                                }
                                else {
                                    const pathInfo = acebase_core_1.PathInfo.get(change.path);
                                    const parentPath = pathInfo.parentPath;
                                    const parentUpdate = mutations.find(u => u.path === parentPath);
                                    const value = change.type === 'remove' || change.data === null || typeof change.data === 'undefined' ? null : change.data;
                                    if (!parentUpdate) {
                                        // Create new parent update
                                        // change.context.acebase_sync = { }; // TODO: Think about what context we could add to let receivers know why this merged update happens
                                        mutations.push({ ids: [id], type: 'update', path: parentPath, data: { [pathInfo.key]: value }, context: change.context });
                                    }
                                    else {
                                        // Add this change to parent update
                                        parentUpdate.data[pathInfo.key] = value;
                                        parentUpdate.ids.push(id);
                                    }
                                }
                                return mutations;
                            }, []);
                        for (const m of mutations) {
                            const ids = m.ids;
                            this.debug.verbose(`SYNC pushing mutations ${ids.join(',')}: `, m);
                            totalPendingChanges++;
                            try {
                                if (m.type === 'update') {
                                    yield this.update(m.path, m.data, { allow_cache: false, context: m.context });
                                }
                                else if (m.type === 'set') {
                                    if (!m.data) {
                                        m.data = null;
                                    } // Before type 'remove' was implemented
                                    yield this.set(m.path, m.data, { allow_cache: false, context: m.context });
                                }
                                else if (m.type === 'remove') {
                                    yield this.set(m.path, null, { allow_cache: false, context: m.context });
                                }
                                else {
                                    throw new Error(`unsupported mutation type "${m.type}"`);
                                }
                                this.debug.verbose(`SYNC mutation ${ids.join(',')} processed ok`);
                                const updates = ids.reduce((updates, id) => (updates[id] = null, updates), {});
                                cacheApi.update(`${this.dbname}/pending`, updates); // delete from cache db
                            }
                            catch (err) {
                                // Updating remote db failed
                                this.debug.error(`SYNC mutations ${ids.join(',')} failed: ${err.message}`);
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
                                ids.forEach(id => {
                                    cacheApi.transaction(`${this.dbname}/pending/${id}`, m => {
                                        if (!m.error) {
                                            m.error = {
                                                first: errorReport,
                                                last: errorReport,
                                                retries: 0,
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
                                });
                                cacheApi.set(`${this.dbname}/stats/last_sync_error`, errorReport).catch(handleStatsUpdateError);
                                // TODO: Send error report to server?
                                // this.reportError({ code: 'sync-mutation', report: errorReport });
                                (_c = options.eventCallback) === null || _c === void 0 ? void 0 : _c.call(options, 'sync_change_error', { error: err, change: m });
                            }
                        }
                        this.debug.verbose(`SYNC push done`);
                        // Update stats
                        cacheApi.set(`${this.dbname}/stats/last_sync_end`, new Date()).catch(handleStatsUpdateError);
                    }
                    catch (err) {
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
                const subscriptionsFor = (path) => subscriptions.filter(sub => sub.path === path);
                if (this.hasCache) { //  && options.fetchFreshData
                    // Part 2: PULL remote changes / fresh data
                    const cacheApi = this.cache.db.api;
                    // Attach temp events to cache db so they will fire for data changes (just for counting)
                    subscriptions.forEach(sub => {
                        sub.tempCallback = () => {
                            totalRemoteChanges++;
                        };
                        cacheApi.subscribe(acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, sub.path), sub.event, sub.tempCallback);
                    });
                    const strategy = {
                        /** Data paths to reload */
                        reload: [],
                        /** Event targets to fetch changes with cursor */
                        cursor: [],
                        /** Subscriptions that have custom sync fallback logic, used when there is no automated way to synchronize */
                        fallback: [],
                        /** Event targets to warn about */
                        warn: [],
                        /** Subscriptions that require no action because they were added after last connect event */
                        noop: [],
                    };
                    // const wasAddedOffline = sub => {
                    //     return sub.lastSynced === 0 && sub.added > this._eventTimeline.disconnect && sub.added < this._eventTimeline.connect;
                    // };
                    const hasStaleValue = (sub) => {
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
                        if (addedWhileOffline) {
                            return true;
                        }
                        if (addedBeforeDisconnection) {
                            return cursor ? false : true;
                        }
                        return false;
                    };
                    strategy.reload = subscriptionPaths
                        .filter(path => {
                        if (path.includes('*') || path.includes('$')) {
                            return false;
                        } // Can't load wildcard paths
                        return subscriptionsFor(path).some(sub => {
                            if (hasStaleValue(sub)) {
                                if (typeof sub.settings.syncFallback === 'function') {
                                    return false;
                                }
                                if (sub.settings.syncFallback === 'reload') {
                                    return true;
                                }
                                if (sub.event === 'value') {
                                    return true;
                                }
                                if (sub.event === 'child_added' && !sub.settings.newOnly) {
                                    return true;
                                }
                            }
                            return false;
                        });
                    })
                        .reduce((reloadPaths, path) => {
                        !reloadPaths.some(p => p === path || acebase_core_1.PathInfo.get(p).isAncestorOf(path)) && reloadPaths.push(path);
                        return reloadPaths;
                    }, []);
                    strategy.fallback = subscriptionPaths
                        .filter(path => !strategy.reload.some(p => p === path || acebase_core_1.PathInfo.get(p).isAncestorOf(path)))
                        .reduce((fallbackItems, path) => {
                        subscriptionsFor(path).forEach(sub => {
                            if (hasStaleValue(sub) && typeof sub.settings.syncFallback === 'function') {
                                fallbackItems.push(sub);
                            }
                        });
                        return fallbackItems;
                    }, []);
                    strategy.cursor = !cursor ? [] : subscriptionPaths
                        .filter(path => !strategy.reload.some(p => p === path || acebase_core_1.PathInfo.get(p).isAncestorOf(path)))
                        .reduce((cursorItems, path) => {
                        const subs = subscriptionsFor(path);
                        const events = subs.filter(sub => !hasStaleValue(sub) && !strategy.fallback.includes(sub))
                            .reduce((events, sub) => (events.includes(sub.event) || events.push(sub.event)) && events, []);
                        events.length > 0 && cursorItems.push({ path, events });
                        return cursorItems;
                    }, []);
                    strategy.warn = subscriptionPaths
                        .filter(path => !strategy.reload.some(p => p === path || acebase_core_1.PathInfo.get(p).isAncestorOf(path)))
                        .reduce((warnItems, path) => {
                        const subs = subscriptionsFor(path).filter(sub => !strategy.fallback.includes(sub));
                        subs.forEach(sub => {
                            if (typeof sub.settings.syncFallback === 'function' || sub.added > this._eventTimeline.connect) {
                                strategy.noop.push(sub);
                            }
                            else if (!strategy.cursor.some(item => item.path === sub.path && item.events.includes(sub.event))) {
                                const item = warnItems.find(item => item.path === sub.path);
                                if (!item) {
                                    warnItems.push({ path: sub.path, events: [sub.event] });
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
                        const cursorPromise = (() => __awaiter(this, void 0, void 0, function* () {
                            let remoteMutations;
                            try {
                                const result = yield this.getChanges({ for: strategy.cursor, cursor });
                                remoteMutations = result.changes;
                                this._updateCursor(result.new_cursor);
                            }
                            catch (err) {
                                this.debug.error(`SYNC: Could not load remote changes`, err);
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
                                yield Promise.all(promises);
                            }
                        }))();
                        syncPromises.push(cursorPromise);
                    }
                    if (strategy.reload.length > 0) {
                        this.debug.log(`SYNC reloading data for event paths ${strategy.reload.map(path => `"/${path}"`).join(', ')}`);
                        const reloadPromise = (() => __awaiter(this, void 0, void 0, function* () {
                            const promises = strategy.reload.map(path => {
                                this.debug.verbose(`SYNC: load "/${path}"`);
                                return this.get(path, { cache_mode: 'bypass' }) // allow_cache: false
                                    .catch(err => {
                                    this.debug.error(`SYNC: could not load "/${path}"`, err);
                                    options.eventCallback && options.eventCallback('sync_pull_error', err);
                                });
                            });
                            yield Promise.all(promises);
                        }))();
                        syncPromises.push(reloadPromise);
                    }
                    if (strategy.fallback.length > 0) {
                        this.debug.log(`SYNC using fallback functions for event(s) ${strategy.fallback.map(sub => `${sub.event} on "/${sub.path}"`).join(', ')}`);
                        const fallbackPromise = (() => __awaiter(this, void 0, void 0, function* () {
                            const promises = strategy.fallback.map((sub) => __awaiter(this, void 0, void 0, function* () {
                                this.debug.verbose(`SYNC: running fallback for event ${sub.event} on "/${sub.path}"`);
                                try {
                                    if (sub.settings.syncFallback === 'reload') {
                                        throw new Error(`DEV ERROR: Not expecting "reload" as fallback`);
                                    }
                                    yield sub.settings.syncFallback();
                                }
                                catch (err) {
                                    this.debug.error(`SYNC: error running fallback function for ${sub.event} on "/${sub.path}"`, err);
                                    options.eventCallback && options.eventCallback('sync_fallback_error', err);
                                }
                            }));
                            yield Promise.all(promises);
                        }))();
                        syncPromises.push(fallbackPromise);
                    }
                    if (strategy.warn.length > 0) {
                        this.debug.warn(`SYNC warning: unable to sync event(s) ${strategy.warn.map(item => `${item.events.map(event => `"${event}"`).join(', ')} on "/${item.path}"`).join(', ')}. To resolve this, provide syncFallback functions for these events`);
                    }
                    // Wait until they're all done
                    yield Promise.all(syncPromises);
                    // Wait shortly to allow any pending temp cache events to fire
                    yield new Promise(resolve => setTimeout(resolve, 10));
                    // Unsubscribe temp cache subscriptions
                    subscriptions.forEach(sub => {
                        if (typeof sub.tempCallback !== 'function') {
                            throw new Error('DEV ERROR: tempCallback must be a function');
                        }
                        cacheApi.unsubscribe(acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, sub.path), sub.event, sub.tempCallback);
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
                        const subs = subscriptionsFor(path);
                        const warnEvents = [];
                        subs.filter(sub => sub.event !== 'value').forEach(sub => {
                            if (typeof sub.settings.syncFallback === 'function') {
                                syncPromises.push(sub.settings.syncFallback());
                            }
                            else {
                                !warnEvents.includes(sub.event) && warnEvents.push(sub.event);
                            }
                        });
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
                    yield Promise.all(syncPromises);
                }
                // Update subscription sync stats
                subscriptions.forEach(sub => sub.lastSynced = Date.now());
                this.debug.verbose(`SYNC done`);
                const info = { local: totalPendingChanges, remote: totalRemoteChanges, method: usedSyncMethod, cursor };
                options.eventCallback && options.eventCallback('sync_done', info);
                return info;
            }
            catch (err) {
                this.debug.error(`SYNC error`, err);
                options.eventCallback && options.eventCallback('sync_error', err);
                throw err;
            }
        });
    }
    /**
     * Gets all relevant mutations for specific events on a path and since specified cursor
     */
    getMutations(filter) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof filter !== 'object') {
                throw new Error('No filter specified');
            }
            if (typeof filter.cursor !== 'string' && typeof filter.timestamp !== 'number') {
                throw new Error('No cursor or timestamp given');
            }
            const query = Object.keys(filter)
                .map(key => {
                let val = filter[key];
                if (key === 'for') {
                    val = encodeURIComponent(JSON.stringify(val));
                }
                return typeof val !== 'undefined' ? `${key}=${val}` : null;
            })
                .filter(p => p != null)
                .join('&');
            const { data, context } = yield this._request({ url: `${this.url}/sync/mutations/${this.dbname}?${query}`, includeContext: true });
            const mutations = acebase_core_1.Transport.deserialize2(data);
            return { used_cursor: (_a = filter.cursor) !== null && _a !== void 0 ? _a : null, new_cursor: context.acebase_cursor, mutations };
        });
    }
    /**
     * Gets all relevant effective changes for specific events on a path and since specified cursor
     */
    getChanges(filter) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof filter !== 'object') {
                throw new Error('No filter specified');
            }
            if (typeof filter.cursor !== 'string' && typeof filter.timestamp !== 'number') {
                throw new Error('No cursor or timestamp given');
            }
            const query = Object.keys(filter)
                .map(key => {
                let val = filter[key];
                if (key === 'for') {
                    val = encodeURIComponent(JSON.stringify(val));
                }
                return typeof val !== 'undefined' ? `${key}=${val}` : null;
            })
                .filter(p => p != null)
                .join('&');
            const { data, context } = yield this._request({ url: `${this.url}/sync/changes/${this.dbname}?${query}`, includeContext: true });
            const changes = acebase_core_1.Transport.deserialize2(data);
            return { used_cursor: (_a = filter.cursor) !== null && _a !== void 0 ? _a : null, new_cursor: context.acebase_cursor, changes };
        });
    }
    _addCacheSetMutation(path, value, context) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Remove all previous mutations on this exact path, and descendants
            const escapedPath = path.replace(/([.*+?\\$^\(\)\[\]\{\}])/g, '\\$1'); // Replace any character that could cripple the regex. NOTE: nobody should use these characters in their data paths in the first place.
            const re = new RegExp(`^${escapedPath}(?:\\[|/|$)`); // matches path, path/child, path[0], path[0]/etc, path/child/etc/etc
            yield ((_a = this._cache) === null || _a === void 0 ? void 0 : _a.db.query(`${this.dbname}/pending`).filter('path', 'matches', re).remove());
            // Add new mutation
            return (_b = this._cache) === null || _b === void 0 ? void 0 : _b.db.api.set(`${this.dbname}/pending/${acebase_core_1.ID.generate()}`, { type: value !== null ? 'set' : 'remove', path, data: value, context });
        });
    }
    set(path, value, options = {
        allow_cache: true,
        context: {},
    }) {
        var _a;
        // TODO: refactor allow_cache to cache_mode
        if (!options.context) {
            options.context = {};
        }
        const useCache = this._cache && options.allow_cache !== false;
        const useServer = this.isConnected;
        // TODO: reduce this contextual overhead to 'client_id' only, or additional debugging info upon request
        options.context.acebase_mutation = options.context.acebase_mutation || {
            client_id: this._id,
            id: acebase_core_1.ID.generate(),
            op: 'set',
            path,
            flow: useCache ? useServer ? 'parallel' : 'cache' : 'server',
        };
        const updateServer = () => __awaiter(this, void 0, void 0, function* () {
            const data = JSON.stringify(acebase_core_1.Transport.serialize(value));
            const { context } = yield this._request({ method: 'PUT', url: `${this.url}/data/${this.dbname}/${path}`, data, context: options.context, includeContext: true });
            Object.assign(options.context, context); // Add to request context
            const cursor = context === null || context === void 0 ? void 0 : context.acebase_cursor;
            return { cursor }; // And return the cursor
        });
        if (!useCache) {
            return updateServer();
        }
        const cachePath = acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path);
        let rollbackValue;
        const updateCache = () => {
            return this.cache.db.api.transaction(cachePath, (currentValue) => {
                rollbackValue = currentValue;
                return value;
            }, { context: options.context });
        };
        const rollbackCache = () => __awaiter(this, void 0, void 0, function* () {
            yield cachePromise; // Must be ready first before we can rollback to previous value
            return this.cache.db.api.set(cachePath, rollbackValue, { context: options.context });
        });
        const addPendingTransaction = () => __awaiter(this, void 0, void 0, function* () {
            yield this._addCacheSetMutation(path, value, options.context);
        });
        const cachePromise = updateCache();
        const tryCachePromise = cachePromise
            .then(() => ({ success: true, error: null }))
            .catch(err => ({ success: false, error: err }));
        const serverPromise = !useServer ? null : updateServer();
        const tryServerPromise = !useServer ? null : serverPromise
            .then(() => ({ success: true, error: null }))
            .catch(err => ({ success: false, error: err }));
        Promise.all([tryCachePromise, tryServerPromise])
            .then(([cacheResult, serverResult]) => {
            var _a;
            const networkError = serverPromise && !(serverResult === null || serverResult === void 0 ? void 0 : serverResult.success) && ((_a = serverResult === null || serverResult === void 0 ? void 0 : serverResult.error) === null || _a === void 0 ? void 0 : _a.isNetworkError) === true;
            if (serverPromise && !networkError) {
                // Server update succeeded, or failed with a non-network related reason
                if (serverResult === null || serverResult === void 0 ? void 0 : serverResult.success) {
                    // Server update success
                    if (!cacheResult.success) {
                        // Cache update failed for some reason?
                        this.debug.error(`Failed to set cache for "${path}". Error: `, cacheResult.error);
                    }
                }
                else {
                    // Server update failed (with a non-network related reason)
                    if (cacheResult.success) {
                        // Cache update did succeed, rollback to previous value
                        this.debug.error(`Failed to set server value for "${path}", rolling back cache to previous value. Error:`, serverResult === null || serverResult === void 0 ? void 0 : serverResult.error);
                        rollbackCache().catch(err => {
                            this.debug.error(`Failed to roll back cache? Error:`, err);
                        });
                    }
                }
            }
            else if (cacheResult.success) {
                // Server was not updated (because we're offline, or a network error occurred), cache update was successful.
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
        return ((_a = this._cache) === null || _a === void 0 ? void 0 : _a.priority) === 'cache' ? cachePromise : serverPromise;
    }
    update(path, updates, options = {
        allow_cache: true,
        context: {},
    }) {
        var _a, _b;
        // TODO: refactor allow_cache to cache_mode
        const useCache = this._cache && options && options.allow_cache !== false;
        const useServer = this.isConnected;
        // TODO: reduce this contextual overhead to 'client_id' only, or additional debugging info upon request
        options.context.acebase_mutation = options.context.acebase_mutation || {
            client_id: this._id,
            id: acebase_core_1.ID.generate(),
            op: 'update',
            path,
            flow: useCache ? useServer ? 'parallel' : 'cache' : 'server',
        };
        const updateServer = () => __awaiter(this, void 0, void 0, function* () {
            const data = JSON.stringify(acebase_core_1.Transport.serialize(updates));
            const { context } = yield this._request({ method: 'POST', url: `${this.url}/data/${this.dbname}/${path}`, data, context: options.context, includeContext: true });
            Object.assign(options.context, context); // Add to request context
            const cursor = context.acebase_cursor;
            return { cursor }; // And return the cursor
        });
        if (!useCache) {
            return updateServer();
        }
        const cacheApi = (_a = this._cache) === null || _a === void 0 ? void 0 : _a.db.api;
        const cachePath = acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path);
        let rollbackUpdates;
        const updateCache = () => __awaiter(this, void 0, void 0, function* () {
            const properties = Object.keys(updates);
            const result = yield cacheApi.get(cachePath, { include: properties });
            rollbackUpdates = result.value;
            properties.forEach(prop => {
                if (!(prop in rollbackUpdates) && updates[prop] !== null) {
                    // Property being updated doesn't exist in current value, set to null
                    rollbackUpdates[prop] = null;
                }
            });
            return cacheApi.update(cachePath, updates, { context: options.context });
        });
        const rollbackCache = () => __awaiter(this, void 0, void 0, function* () {
            yield cachePromise; // Must be ready first before we can rollback to previous value
            return cacheApi.update(cachePath, rollbackUpdates, { context: options.context });
        });
        const addPendingTransaction = () => __awaiter(this, void 0, void 0, function* () {
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
            const pathInfo = acebase_core_1.PathInfo.get(path);
            const mutations = Object.keys(updates).map((prop) => {
                if (updates instanceof Array) {
                    prop = parseInt(prop);
                }
                return {
                    path: pathInfo.childPath(prop),
                    value: updates[prop],
                };
            });
            // Store new pending 'set' operations (null values will be stored as 'remove')
            const promises = mutations.map(m => this._addCacheSetMutation(m.path, m.value, options.context));
            yield Promise.all(promises);
        });
        const cachePromise = updateCache();
        const tryCachePromise = cachePromise
            .then(() => ({ success: true, error: null }))
            .catch(err => ({ success: false, error: err }));
        const serverPromise = !useServer ? null : updateServer();
        const tryServerPromise = !useServer ? { executed: false, success: false, error: null } : serverPromise
            .then(() => ({ executed: true, success: true, error: null }))
            .catch(err => ({ executed: true, success: false, error: err }));
        Promise.all([tryCachePromise, tryServerPromise])
            .then(([cacheResult, serverResult]) => {
            const networkError = serverResult.executed && !serverResult.success && serverResult.error.isNetworkError === true;
            if (serverResult.executed && !networkError) {
                // Server update succeeded, or failed with a non-network related reason
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
                        this.debug.error(`Failed to update server value for "${path}", rolling back cache to previous value. Error:`, serverResult.error);
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
        return ((_b = this._cache) === null || _b === void 0 ? void 0 : _b.priority) === 'cache' ? cachePromise : serverPromise;
    }
    /**
     * @returns Returns a promise that resolves with the value, context and optionally a server cursor
     */
    get(path, options = {
        cache_mode: 'allow',
    }) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options.cache_mode !== 'string') {
                options.cache_mode = 'allow';
            }
            const useCache = this._cache && options.cache_mode !== 'bypass';
            const getServerValue = () => __awaiter(this, void 0, void 0, function* () {
                // Get from server
                let url = `${this.url}/data/${this.dbname}/${path}`;
                let filtered = false;
                if (options) {
                    const query = [];
                    if (options.exclude instanceof Array) {
                        query.push(`exclude=${options.exclude.join(',')}`);
                    }
                    if (options.include instanceof Array) {
                        query.push(`include=${options.include.join(',')}`);
                    }
                    if (typeof options.child_objects === 'boolean') {
                        query.push(`child_objects=${options.child_objects}`);
                    }
                    if (query.length > 0) {
                        filtered = true;
                        url += `?${query.join('&')}`;
                    }
                }
                const result = yield this._request({ url, includeContext: true });
                const context = result.context;
                const cursor = context && context.acebase_cursor;
                const value = acebase_core_1.Transport.deserialize(result.data);
                if (this._cache) {
                    // Update cache without waiting
                    // DISABLED: if filtered data was requested, it should be merged with current data (nested objects in particular)
                    // if (filtered) {
                    //     this._cache.db.api.update(`${this.dbname}/cache/${path}`, val);
                    // }
                    if (!filtered) {
                        const cachePath = acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path);
                        this._cache.db.api.set(cachePath, value, { context: { acebase_operation: 'update_cache', acebase_server_context: context } })
                            .catch(err => {
                            this.debug.error(`Error caching data for "/${path}"`, err);
                        });
                    }
                }
                return { value, context, cursor };
            });
            const getCacheValue = (throwOnNull = false) => __awaiter(this, void 0, void 0, function* () {
                if (!this._cache) {
                    throw new Error(`DEV ERROR: cannot get cached value if no cache is used!`);
                }
                const result = yield this._cache.db.api.get(acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path), options);
                let { value, context } = result;
                if (!('value' in result && 'context' in result)) {
                    console.warn(`Missing context from cache results. Update your acebase package`);
                    value = result, context = {};
                }
                if (value === null && throwOnNull) {
                    throw new errors_1.CachedValueUnavailableError(path);
                }
                delete context.acebase_cursor; // Do NOT pass along use cache cursor!!
                return { value, context };
            });
            if (options.cache_mode === 'force') {
                // Only load cached value
                const { value, context } = yield getCacheValue(false); // Do not throw on null with cache_mode: 'force'
                context.acebase_origin = 'cache';
                return { value, context };
            }
            if (useCache && typeof options.cache_cursor === 'string') {
                // Update cache with mutations from cursor, then load cached value
                let syncResult;
                try {
                    syncResult = yield this.updateCache(path, options.cache_cursor);
                }
                catch (err) {
                    // Failed to update cache, we might be offline. Proceed with cache value
                }
                const { value, context } = yield getCacheValue(false); // don't throw on null value, it was updated from the server just now
                if (syncResult) {
                    context.acebase_cursor = syncResult.new_cursor;
                    context.acebase_origin = 'hybrid';
                }
                else {
                    context.acebase_cursor = options.cache_cursor;
                    context.acebase_origin = 'cache';
                }
                return { value, context, cursor: context.acebase_cursor };
            }
            if (!useCache) {
                // Cache not available or allowed to be used, get server value
                const { value, context, cursor } = yield getServerValue();
                context.acebase_origin = 'server';
                return { value, context, cursor };
            }
            if (!this.isConnected || ((_a = this._cache) === null || _a === void 0 ? void 0 : _a.priority) === 'cache') {
                // Server not connected, or priority is set to 'cache'. Get cached value
                const throwOnNull = ((_b = this._cache) === null || _b === void 0 ? void 0 : _b.priority) !== 'cache';
                const { value, context } = yield getCacheValue(throwOnNull);
                context.acebase_origin = 'cache';
                return { value, context };
            }
            // Get both, use cached value if available and server version takes too long
            return new Promise((resolve, reject) => {
                let wait = true, done = false;
                const gotValue = (source, val) => {
                    var _a;
                    this.debug.verbose(`Got ${source} value of "${path}":`, val);
                    if (done) {
                        return;
                    }
                    const { value, context, cursor } = val;
                    if (source === 'server') {
                        done = true;
                        this.debug.verbose(`Using server value for "${path}"`);
                        context.acebase_origin = 'server';
                        resolve({ value, context, cursor });
                    }
                    else if (value === null) {
                        // Cached value is not available
                        if (!wait) {
                            const serverError = (_a = errors.find(e => e.source === 'server')) === null || _a === void 0 ? void 0 : _a.error;
                            if (serverError.isNetworkError) {
                                // On network related errors, we thought we were connected but apparently weren't.
                                // If we had known this up-front, getCachedValue(true) would have been executed and
                                // thrown a CachedValueUnavailableError with default message. Let's do that now
                                return reject(new errors_1.CachedValueUnavailableError(path));
                            }
                            // Could not get server value because of a non-network related issue - possibly unauthorized access
                            const error = new errors_1.CachedValueUnavailableError(path, `Value for "${path}" not found in cache, and server value could not be loaded. See serverError for more details`);
                            error.serverError = serverError;
                            return reject(error);
                        }
                    }
                    else if (!wait) {
                        // Cached results, don't wait for server value
                        done = true;
                        this.debug.verbose(`Using cache value for "${path}"`);
                        context.acebase_origin = 'cache';
                        resolve({ value, context });
                    }
                    else {
                        // Cached results, wait 1s before resolving with this value, server value might follow soon
                        setTimeout(() => {
                            if (done) {
                                return;
                            }
                            this.debug.verbose(`Using (delayed) cache value for "${path}"`);
                            done = true;
                            context.acebase_origin = 'cache';
                            resolve({ value, context });
                        }, 1000);
                    }
                };
                const errors = [];
                const gotError = (source, error) => {
                    var _a;
                    errors.push({ source, error });
                    if (errors.length === 2) {
                        // Both failed, reject with server error
                        reject((_a = errors.find(e => e.source === 'server')) === null || _a === void 0 ? void 0 : _a.error);
                    }
                };
                getServerValue()
                    .then(val => gotValue('server', val))
                    .catch(err => (wait = false, gotError('server', err)));
                getCacheValue(false)
                    .then(val => gotValue('cache', val))
                    .catch(err => gotError('cache', err));
            });
        });
    }
    exists(path, options = {
        allow_cache: true,
    }) {
        // TODO: refactor allow_cache to cache_mode
        // TODO: refactor to include context in return value: acebase_origin: 'cache' or 'server'
        const useCache = this._cache && options.allow_cache !== false;
        const getCacheExists = () => {
            if (!this._cache) {
                throw new Error('DEV ERROR: no cache db available to check exists');
            }
            return this._cache.db.api.exists(acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path));
        };
        const getServerExists = () => {
            return this._request({ url: `${this.url}/exists/${this.dbname}/${path}` })
                .then(res => res.exists)
                .catch(err => {
                throw err;
            });
        };
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
                    if (done) {
                        return;
                    }
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
                            if (done) {
                                return;
                            }
                            done = true;
                            resolve(exists);
                        }, 1000);
                    }
                };
                const errors = [];
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
        const postData = ['PUT', 'POST'].includes(method) ? data : null;
        let url = `${this.url}/ext/${this.dbname}/${path}`;
        if (data && !['PUT', 'POST'].includes(method)) {
            // Add to query string
            if (typeof data === 'object') {
                // Convert object to querystring
                data = Object.keys(data)
                    .filter(key => typeof data[key] !== 'undefined')
                    .map(key => key + '=' + encodeURIComponent(JSON.stringify(data[key])))
                    .join('&');
            }
            else if (typeof data !== 'string' || !data.includes('=')) {
                throw new Error('data must be an object, or a string with query parameters, like "index=3&name=Something"');
            }
            url += `?` + data;
        }
        return this._request({ method, url, data: postData, ignoreConnectionState: true });
    }
    /**
     * Clears the entire cache, or a specific path without raising any events
     */
    clearCache(path = '') {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._cache) {
                const value = path === '' ? {} : null;
                const cachePath = acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path);
                return this._cache.db.api.set(cachePath, value, { suppress_events: true });
            }
        });
    }
    /**
     * Updates the local cache with remote changes by retrieving all mutations to `path` since given `cursor` and applying them to the local cache database.
     * If the local path does not exist or no cursor is given, its entire value will be loaded from the server and stored in cache. If no cache database is used, an error will be thrown.
     */
    updateCache(
    /**
     * Path to update. The root path will be used if not given, synchronizing the entire database.
     */
    path = '', 
    /**
     * A previously acquired cursor to update the cache with. If not specified, `path`'s entire value will be loaded from the server
     */
    cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._cache) {
                throw new Error(`No cache database used`);
            }
            const cachePath = acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path);
            const cacheApi = this._cache.db.api;
            const loadValue = cursor === null || typeof cursor === 'undefined' || !(yield cacheApi.exists(cachePath));
            if (loadValue) {
                // Load from server, store in cache (.get takes care of that)
                const { value, context } = yield this.get(path, { cache_mode: 'bypass' });
                return { path, used_cursor: cursor, new_cursor: context.acebase_cursor, loaded_value: true, changes: [] };
            }
            // Get effective changes from server
            const { changes, new_cursor } = yield this.getChanges({ path, cursor });
            for (const ch of changes) {
                // Apply to local cache
                const cachePath = acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, ch.path);
                const options = { context: ch.context, suppress_events: false };
                if (ch.type === 'update') {
                    yield cacheApi.update(cachePath, ch.value, options);
                }
                else if (ch.type === 'set') {
                    yield cacheApi.set(cachePath, ch.value, options);
                }
            }
            return { path, used_cursor: cursor, new_cursor, loaded_value: false, changes };
        });
    }
    /**
     * @returns returns a promise that resolves with matching data or paths in `results`
     */
    query(path, query, options = { snapshots: false, cache_mode: 'allow', monitor: { add: false, change: false, remove: false } }) {
        return __awaiter(this, void 0, void 0, function* () {
            const useCache = this.hasCache && (options.cache_mode === 'force' || (options.cache_mode === 'allow' && !this.isConnected));
            if (useCache) {
                // Not connected, or "force" cache_mode: query cache db
                const data = yield this.cache.db.api.query(acebase_core_1.PathInfo.getChildPath(`${this.dbname}/cache`, path), query, options);
                let { results, context } = data;
                const { stop } = data;
                if (!('results' in data && 'context' in data)) {
                    // OLD api did not return context
                    console.warn(`Missing context from local query results. Update your acebase package`);
                    results = data;
                    context = {};
                }
                context.acebase_origin = 'cache';
                delete context.acebase_cursor; // Do NOT pass along use cache cursor!!
                return { results, context, stop };
            }
            const request = {
                query,
                options,
            };
            if (options.monitor === true || (typeof options.monitor === 'object' && (options.monitor.add || options.monitor.change || options.monitor.remove))) {
                console.assert(typeof options.eventHandler === 'function', `no eventHandler specified to handle realtime changes`);
                if (!this.socket) {
                    throw new Error(`Cannot create realtime query because websocket is not connected. Check your AceBaseClient network.realtime setting`);
                }
                request.query_id = acebase_core_1.ID.generate();
                request.client_id = this.socket.id;
                this._realtimeQueries[request.query_id] = { query, options };
            }
            const reqData = JSON.stringify(acebase_core_1.Transport.serialize(request));
            try {
                const { data, context } = yield this._request({ method: 'POST', url: `${this.url}/query/${this.dbname}/${path}`, data: reqData, includeContext: true });
                const results = acebase_core_1.Transport.deserialize(data);
                context.acebase_origin = 'server';
                const stop = () => __awaiter(this, void 0, void 0, function* () {
                    // Stops subscription of realtime query results. Requires acebase-server v1.10.0+
                    delete this._realtimeQueries[request.query_id];
                    yield _websocketRequest(this.socket, 'query-unsubscribe', { query_id: request.query_id }, this.accessToken);
                });
                return { results: results.list, context, stop };
            }
            catch (err) {
                throw err;
            }
        });
    }
    createIndex(path, key, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options && options.config && Object.values(options.config).find(val => typeof val === 'function')) {
                throw new Error(`Cannot create an index with callback functions through a client. Move your code serverside`);
            }
            const version = this._serverVersion.split('.');
            if (version.length === 3 && +version[0] >= 1 && +version[1] >= 10) {
                // acebase-server v1.10+ has a new dedicated endpoint at /index/dbname/create
                const data = JSON.stringify({ path, key, options });
                return yield this._request({ method: 'POST', url: `${this.url}/index/${this.dbname}/create`, data });
            }
            else {
                const data = JSON.stringify({ action: 'create', path, key, options });
                return yield this._request({ method: 'POST', url: `${this.url}/index/${this.dbname}`, data });
            }
        });
    }
    getIndexes() {
        return this._request({ url: `${this.url}/index/${this.dbname}` });
    }
    deleteIndex(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            // Requires acebase-server v1.10+
            const version = this._serverVersion.split('.');
            if (version.length === 3 && +version[0] >= 1 && +version[1] >= 10) {
                const data = JSON.stringify({ fileName });
                return this._request({ method: 'POST', url: `${this.url}/index/${this.dbname}/delete`, data });
            }
            else {
                throw new Error(`not supported, requires acebase-server 1.10 or higher`);
            }
        });
    }
    reflect(path, type, args) {
        let url = `${this.url}/reflect/${this.dbname}/${path}?type=${type}`;
        if (typeof args === 'object') {
            const query = Object.keys(args).map(key => {
                return `${key}=${args[key]}`;
            });
            if (query.length > 0) {
                url += `&${query.join('&')}`;
            }
        }
        return this._request({ url });
    }
    export(path, write, options = { format: 'json', type_safe: true }) {
        options.format = 'json';
        options.type_safe = options.type_safe !== false;
        const url = `${this.url}/export/${this.dbname}/${path}?format=${options.format}&type_safe=${options.type_safe ? 1 : 0}`;
        return this._request({ url, dataReceivedCallback: chunk => write(chunk) });
    }
    import(path, read, options = { format: 'json', suppress_events: false }) {
        options.format = 'json';
        options.suppress_events = options.suppress_events === true;
        const url = `${this.url}/import/${this.dbname}/${path}?format=${options.format}&suppress_events=${options.suppress_events ? 1 : 0}`;
        return this._request({ method: 'POST', url, dataRequestCallback: length => read(length) });
    }
    get serverPingUrl() {
        return `${this.url}/ping/${this.dbname}`;
    }
    getServerInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield this._request({ url: `${this.url}/info/${this.dbname}` }).catch(err => {
                // Prior to acebase-server v0.9.37, info was at /info (no dbname attached)
                if (!err.isNetworkError) {
                    this.debug.warn(`Could not get server info, update your acebase server version`);
                }
                return { version: 'unknown', time: Date.now() };
            });
            this._serverVersion = info.version;
            return info;
        });
    }
    setSchema(path, schema) {
        if (schema !== null) {
            schema = (new acebase_core_1.SchemaDefinition(schema)).text;
        }
        const data = JSON.stringify({ action: 'set', path, schema });
        return this._request({ method: 'POST', url: `${this.url}/schema/${this.dbname}`, data });
    }
    getSchema(path) {
        return this._request({ url: `${this.url}/schema/${this.dbname}/${path}` });
    }
    getSchemas() {
        return this._request({ url: `${this.url}/schema/${this.dbname}` });
    }
    validateSchema(path, value, isUpdate) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Manual schema validation can only be used on standalone databases`);
        });
    }
}
exports.WebApi = WebApi;

},{"./base64":4,"./errors":6,"./promise-timeout":9,"./request":10,"./request/error":11,"acebase-core":30,"socket.io-client":18}],3:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AceBaseClientAuth = void 0;
const user_1 = require("./user");
class AceBaseClientAuth {
    constructor(client, eventCallback) {
        this.client = client;
        this.eventCallback = eventCallback;
        this.user = null;
        this.accessToken = null;
    }
    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param username A database username
     * @param password The password
     * @returns returns a promise that resolves with the signed in user and access token
     */
    signIn(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.signIn(username, password);
            if (this.user) {
                this.eventCallback('signout', { source: 'signin', user: this.user });
            }
            this.accessToken = details.accessToken;
            this.user = new user_1.AceBaseUser(details.user);
            this.eventCallback('signin', { source: 'signin', user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken };
        });
    }
    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param email An email address
     * @param password The password
     * @returns returns a promise that resolves with the signed in user and access token
     */
    signInWithEmail(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.signInWithEmail(email, password);
            if (this.user) {
                this.eventCallback('signout', { source: 'email_signin', user: this.user });
            }
            this.accessToken = details.accessToken;
            this.user = new user_1.AceBaseUser(details.user);
            this.eventCallback('signin', { source: 'email_signin', user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; //success: true,
        });
    }
    /**
     * Sign into an account using a previously acquired access token
     * @param accessToken a previously acquired access token
     * @returns returns a promise that resolves with the signed in user and access token. If the token is not right, the thrown `error.code` will be `'not_found'` or `'invalid_token'`
     */
    signInWithToken(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.signInWithToken(accessToken);
            if (this.user) {
                this.eventCallback('signout', { source: 'token_signin', user: this.user });
            }
            this.accessToken = details.accessToken;
            this.user = new user_1.AceBaseUser(details.user);
            this.eventCallback('signin', { source: 'token_signin', user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; // success: true,
        });
    }
    /**
     * If the client is offline, you can specify an access token to automatically try signing in the user once a connection is made.
     * Doing this is recommended if you are subscribing to event paths that require user authentication/authorization. Subscribing to
     * those server events will then be done after signing in, instead of failing after connecting anonymously.
     * @param accessToken A previously acquired access token
     */
    setAccessToken(accessToken) {
        this.client.api.setAccessToken(accessToken);
    }
    /**
     * If the server has been configured with OAuth providers, use this to kick off the authentication flow.
     * This method returs a Promise that resolves with the url you have to redirect your user to authenticate
     * with the requested provider. After the user has authenticated, they will be redirected back to your callbackUrl.
     * Your code in the callbackUrl will have to call finishOAuthProviderSignIn with the result querystring parameter
     * to finish signing in.
     * @param providerName one of the configured providers (eg 'facebook', 'google', 'apple', 'spotify')
     * @param callbackUrl url on your website/app that will receive the sign in result
     * @param options optional provider specific authentication settings
     * @returns returns a Promise that resolves with the url you have to redirect your user to.
     */
    startAuthProviderSignIn(providerName, callbackUrl, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.startAuthProviderSignIn(providerName, callbackUrl, options);
            return details.redirectUrl;
        });
    }
    /**
     * Use this method to finish OAuth flow from your callbackUrl.
     * @param callbackResult result received in your.callback/url?result
     */
    finishAuthProviderSignIn(callbackResult) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.finishAuthProviderSignIn(callbackResult);
            const isOtherUser = !this.user || this.user.uid !== details.user.uid;
            isOtherUser && this.eventCallback('signout', { source: 'oauth_signin', user: this.user });
            this.accessToken = details.accessToken;
            this.user = new user_1.AceBaseUser(details.user);
            isOtherUser && this.eventCallback('signin', { source: 'oauth_signin', user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken, provider: details.provider }; // success: true,
        });
    }
    /**
     * Refreshes an expiring access token with the refresh token returned from finishAuthProviderSignIn
     */
    refreshAuthProviderToken(providerName, refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.refreshAuthProviderToken(providerName, refreshToken);
            return { provider: details.provider };
        });
    }
    /**
     * Signs in with an external auth provider by redirecting the user to the provider's login page.
     * After signing in, the user will be redirected to the current browser url. Execute
     * getRedirectResult() when your page is loaded again to check if the user was authenticated.
     */
    signInWithRedirect(providerName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof window === 'undefined') {
                throw new Error(`signInWithRedirect can only be used within a browser context`);
            }
            const redirectUrl = yield this.startAuthProviderSignIn(providerName, window.location.href);
            window.location.href = redirectUrl;
        });
    }
    /**
     * Checks if the user authentication with an auth provider.
     */
    getRedirectResult() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof window === 'undefined') {
                throw new Error(`getRedirectResult can only be used within a browser context`);
            }
            const match = window.location.search.match(/[?&]result=(.*?)(?:&|$)/);
            const callbackResult = match && decodeURIComponent(match[1]);
            if (!callbackResult) {
                return null;
            }
            return yield this.finishAuthProviderSignIn(callbackResult);
        });
    }
    /**
     * Signs out of the current account
     * @param options options object, or boolean specifying whether to signout everywhere
     * @returnsreturns a promise that resolves when user was signed out successfully
     */
    signOut(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            else if (!this.user) {
                throw { code: 'not_signed_in', message: 'Not signed in!' };
            }
            if (this.client.connected) {
                yield this.client.api.signOut(options);
            }
            this.accessToken = null;
            const user = this.user;
            this.user = null;
            this.eventCallback('signout', { source: 'signout', user });
        });
    }
    /**
     * Changes the password of the currently signed into account
     * @param oldPassword
     * @param newPassword
     * @returns returns a promise that resolves with a new access token
     */
    changePassword(oldPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            if (!this.user) {
                throw { code: 'not_signed_in', message: 'Not signed in!' };
            }
            const result = yield this.client.api.changePassword(this.user.uid, oldPassword, newPassword);
            this.accessToken = result.accessToken;
            this.eventCallback('signin', { source: 'password_change', user: this.user, accessToken: this.accessToken });
            return { accessToken: result.accessToken }; //success: true,
        });
    }
    /**
     * Requests a password reset for the account with specified email address
     * @param email
     * @returns returns a promise that resolves once the request has been processed
     */
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            yield this.client.api.forgotPassword(email);
        });
    }
    /**
     * Requests a password to be changed using a previously acquired reset code, sent to the email address with forgotPassword
     * @param resetCode
     * @param newPassword
     * @returns returns a promise that resolves once the password has been changed. The user is now able to sign in with the new password
     */
    resetPassword(resetCode, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            yield this.client.api.resetPassword(resetCode, newPassword);
        });
    }
    /**
     * Verifies an e-mail address using the code sent to the email address upon signing up
     * @param verificationCode
     * @returns returns a promise that resolves when verification was successful
     */
    verifyEmailAddress(verificationCode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            yield this.client.api.verifyEmailAddress(verificationCode);
        });
    }
    /**
     * Updates one or more user account details
     * @returns returns a promise with the updated user details
     */
    updateUserDetails(details) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            if (!this.user) {
                throw { code: 'not_signed_in', message: 'Not signed in!' };
            }
            if (typeof details !== 'object') {
                throw { code: 'invalid_details', message: 'details must be an object' };
            }
            const result = yield this.client.api.updateUserDetails(details);
            if (!this.user) {
                // Signed out in the mean time
                return { user: null };
            }
            for (const key of Object.keys(result.user)) {
                this.user[key] = result.user[key];
            }
            return { user: this.user };
        });
    }
    /**
     * Changes the username of the currrently signed into account
     * @returns returns a promise that resolves with the updated user details
     */
    changeUsername(newUsername) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateUserDetails({ username: newUsername });
        });
    }
    /**
     * Changes the display name of the currrently signed into account
     * @param newName
     * @returns returns a promise that resolves with the updated user details
     */
    changeDisplayName(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateUserDetails({ display_name: newName });
        });
    }
    /**
     * Changes the email address of the currrently signed in user
     * @param newEmail
     * @returns returns a promise that resolves with the updated user details
     */
    changeEmail(newEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateUserDetails({ email: newEmail });
        });
    }
    /**
     * Changes the user's profile picture
     * @returns returns a promise that resolves with the updated user details
     */
    changePicture(newPicture) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateUserDetails({ picture: newPicture });
        });
    }
    /**
     * Updates settings of the currrently signed in user. Passed settings will be merged with the user's current settings
     * @param settings the settings to update
     * @returns returns a promise that resolves with the updated user details
     */
    updateUserSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateUserDetails({ settings });
        });
    }
    /**
     * Creates a new user account with the given details. If successful, you will automatically be
     * signed into the account. Note: the request will fail if the server has disabled this option
     * @returns returns a promise that resolves with the signed in user and access token
     */
    signUp(details) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!details.username && !details.email) {
                throw { code: 'invalid_details', message: 'No username or email set' };
            }
            if (!details.password) {
                throw { code: 'invalid_details', message: 'No password given' };
            }
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const isAdmin = this.user && this.user.uid === 'admin';
            if (this.user && !isAdmin) {
                // Sign out of current account
                const user = this.user;
                this.user = null;
                this.eventCallback('signout', { source: 'signup', user });
            }
            const result = yield this.client.api.signUp(details, !isAdmin);
            if (isAdmin) {
                return { user: result.user };
            }
            else {
                // Sign into new account
                this.accessToken = result.accessToken;
                this.user = new user_1.AceBaseUser(result.user);
                this.eventCallback('signin', { source: 'signup', user: this.user, accessToken: this.accessToken });
                return { user: this.user, accessToken: this.accessToken }; //success: true,
            }
        });
    }
    /**
     * Removes the currently signed in user account and signs out. Note: this will only
     * remove the database user account, not any data stored in the database by this user. It is
     * your own responsibility to remove that data.
     * @param uid for admin user only: remove account with specific uid
     */
    deleteAccount(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            if (!this.user) {
                throw { code: 'not_signed_in', message: 'Not signed in!' };
            }
            if (uid && this.user.uid !== 'admin') {
                throw { code: 'not_admin', message: 'Cannot remove other accounts than signed into account, unless you are admin' };
            }
            const deleteUid = uid || this.user.uid;
            if (deleteUid === 'admin') {
                throw { code: 'not_allowed', message: 'Cannot remove admin user' };
            }
            const signOut = this.user.uid !== 'admin';
            const result = yield this.client.api.deleteAccount(deleteUid, signOut);
            if (signOut) {
                // Sign out of the account
                this.accessToken = null;
                const user = this.user;
                this.user = null;
                this.eventCallback('signout', { source: 'delete_account', user });
            }
        });
    }
}
exports.AceBaseClientAuth = AceBaseClientAuth;

},{"./user":13}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.encode = void 0;
function encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}
exports.encode = encode;
function decode(base64) {
    return decodeURIComponent(escape(atob(base64)));
}
exports.decode = decode;

},{}],5:[function(require,module,exports){
"use strict";
/*
    * This file is used to generate a browser bundle to use as an include
    (re)generate it with: npm run browserify

    * To use AceBaseClient in the browser:
    <script type="text/javascript" src="dist/browser.min.js"></script>
    <script type="text/javascript">
        const db = new AceBaseClient({ dbname: 'dbname', host: 'localhost', port: 3000, https: false });
        db.ready(() => {
            // Ready to do some work
        })
    </script>
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const acebaseclient = require("./index");
window.acebaseclient = acebaseclient;
window.AceBaseClient = acebaseclient.AceBaseClient; // Shortcut to AceBaseClient
__exportStar(require("./index"), exports);

},{"./index":7}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedValueUnavailableError = void 0;
class CachedValueUnavailableError extends Error {
    constructor(path, message) {
        super(message || `Value for path "/${path}" is not available in cache`);
        this.path = path;
    }
}
exports.CachedValueUnavailableError = CachedValueUnavailableError;

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedValueUnavailableError = exports.ServerDate = exports.AceBaseClient = exports.Transport = exports.PartialArray = exports.ObjectCollection = exports.proxyAccess = exports.ID = exports.TypeMappings = exports.PathReference = exports.EventSubscription = exports.DataSnapshot = exports.DataReference = void 0;
var acebase_core_1 = require("acebase-core");
Object.defineProperty(exports, "DataReference", { enumerable: true, get: function () { return acebase_core_1.DataReference; } });
Object.defineProperty(exports, "DataSnapshot", { enumerable: true, get: function () { return acebase_core_1.DataSnapshot; } });
Object.defineProperty(exports, "EventSubscription", { enumerable: true, get: function () { return acebase_core_1.EventSubscription; } });
Object.defineProperty(exports, "PathReference", { enumerable: true, get: function () { return acebase_core_1.PathReference; } });
Object.defineProperty(exports, "TypeMappings", { enumerable: true, get: function () { return acebase_core_1.TypeMappings; } });
Object.defineProperty(exports, "ID", { enumerable: true, get: function () { return acebase_core_1.ID; } });
Object.defineProperty(exports, "proxyAccess", { enumerable: true, get: function () { return acebase_core_1.proxyAccess; } });
Object.defineProperty(exports, "ObjectCollection", { enumerable: true, get: function () { return acebase_core_1.ObjectCollection; } });
Object.defineProperty(exports, "PartialArray", { enumerable: true, get: function () { return acebase_core_1.PartialArray; } });
Object.defineProperty(exports, "Transport", { enumerable: true, get: function () { return acebase_core_1.Transport; } });
var acebase_client_1 = require("./acebase-client");
Object.defineProperty(exports, "AceBaseClient", { enumerable: true, get: function () { return acebase_client_1.AceBaseClient; } });
var server_date_1 = require("./server-date");
Object.defineProperty(exports, "ServerDate", { enumerable: true, get: function () { return server_date_1.ServerDate; } });
var errors_1 = require("./errors");
Object.defineProperty(exports, "CachedValueUnavailableError", { enumerable: true, get: function () { return errors_1.CachedValueUnavailableError; } });

},{"./acebase-client":1,"./errors":6,"./server-date":12,"acebase-core":30}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = performance;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseTimeout = exports.PromiseTimeoutError = void 0;
class PromiseTimeoutError extends Error {
}
exports.PromiseTimeoutError = PromiseTimeoutError;
function promiseTimeout(promise, ms, comment) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new PromiseTimeoutError(`Promise ${comment ? `"${comment}" ` : ''}timed out after ${ms}ms`)), ms);
        function success(result) {
            clearTimeout(timeout);
            resolve(result);
        }
        promise.then(success).catch(reject);
    });
}
exports.promiseTimeout = promiseTimeout;

},{}],10:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("./error");
/**
 * @returns returns a promise that resolves with an object containing data and an optionally returned context
 */
function request(method, url, options = { accessToken: null, data: null, dataReceivedCallback: null, dataRequestCallback: null, context: null }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let postData = options.data;
        if (typeof postData === 'undefined' || postData === null) {
            postData = '';
        }
        else if (typeof postData === 'object') {
            postData = JSON.stringify(postData);
        }
        const headers = {
            'AceBase-Context': JSON.stringify(options.context || null),
        };
        const init = {
            method,
            headers,
            body: undefined,
        };
        if (typeof options.dataRequestCallback === 'function') {
            // Stream data to the server instead of posting all from memory at once
            headers['Content-Type'] = 'text/plain'; // Prevent server middleware parsing the content as JSON
            const supportsStreaming = false;
            if (supportsStreaming) {
                // Streaming uploads appears not to be implemented in Chromium/Chrome yet.
                // Setting the body property to a ReadableStream results in the string "[object ReadableStream]"
                // See https://bugs.chromium.org/p/chromium/issues/detail?id=688906 and https://stackoverflow.com/questions/40939857/fetch-with-readablestream-as-request-body
                let canceled = false;
                init.body = new ReadableStream({
                    pull(controller) {
                        var _a;
                        return __awaiter(this, void 0, void 0, function* () {
                            const chunkSize = controller.desiredSize || 1024 * 16;
                            const chunk = yield ((_a = options.dataRequestCallback) === null || _a === void 0 ? void 0 : _a.call(options, chunkSize));
                            if (canceled || [null, ''].includes(chunk)) {
                                controller.close();
                            }
                            else {
                                controller.enqueue(chunk);
                            }
                        });
                    },
                    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
                    start(controller) {
                        return __awaiter(this, void 0, void 0, function* () { });
                    },
                    cancel() {
                        canceled = true;
                    },
                });
            }
            else {
                // Streaming not supported
                postData = '';
                const chunkSize = 1024 * 512; // Use large chunk size, we have to store everything in memory anyway.
                let chunk;
                while ((chunk = yield options.dataRequestCallback(chunkSize))) {
                    postData += chunk;
                }
                init.body = postData;
            }
        }
        else if (postData.length > 0) {
            headers['Content-Type'] = 'application/json';
            init.body = postData;
        }
        if (options.accessToken) {
            headers['Authorization'] = `Bearer ${options.accessToken}`;
        }
        const request = { url, method, headers, body: undefined };
        const res = yield fetch(request.url, init).catch(err => {
            // console.error(err);
            throw new error_1.AceBaseRequestError(request, null, 'fetch_failed', err.message);
        });
        let data = '';
        if (typeof options.dataReceivedCallback === 'function') {
            // Stream response
            const reader = (_a = res.body) === null || _a === void 0 ? void 0 : _a.getReader();
            yield new Promise((resolve, reject) => {
                (function readNext() {
                    var _a;
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            const result = yield (reader === null || reader === void 0 ? void 0 : reader.read());
                            (_a = options.dataReceivedCallback) === null || _a === void 0 ? void 0 : _a.call(options, result === null || result === void 0 ? void 0 : result.value);
                            if (result === null || result === void 0 ? void 0 : result.done) {
                                return resolve();
                            }
                            readNext();
                        }
                        catch (err) {
                            reader === null || reader === void 0 ? void 0 : reader.cancel('error');
                            reject(err);
                        }
                    });
                })();
            });
        }
        else {
            data = yield res.text();
        }
        const isJSON = data[0] === '{' || data[0] === '['; // || (res.headers['content-type'] || '').startsWith('application/json')
        if (res.status === 200) {
            const contextHeader = res.headers.get('AceBase-Context');
            let context;
            if (contextHeader && contextHeader[0] === '{') {
                context = JSON.parse(contextHeader);
            }
            else {
                context = {};
            }
            if (isJSON) {
                data = JSON.parse(data);
            }
            return { context, data };
        }
        else {
            request.body = postData;
            const response = {
                statusCode: res.status,
                statusMessage: res.statusText,
                headers: res.headers,
                body: data,
            };
            let code = res.status, message = res.statusText;
            if (isJSON) {
                const err = JSON.parse(data);
                if (err.code) {
                    code = err.code;
                }
                if (err.message) {
                    message = err.message;
                }
            }
            throw (new error_1.AceBaseRequestError(request, response, code, message));
        }
    });
}
exports.default = request;

},{"./error":11}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOT_CONNECTED_ERROR_MESSAGE = exports.AceBaseRequestError = void 0;
class AceBaseRequestError extends Error {
    constructor(request, response, code, message = 'unknown error') {
        super(message);
        this.request = request;
        this.response = response;
        this.code = code;
        this.message = message;
    }
    get isNetworkError() {
        return this.response === null;
    }
}
exports.AceBaseRequestError = AceBaseRequestError;
exports.NOT_CONNECTED_ERROR_MESSAGE = 'remote database is not connected'; //'AceBaseClient is not connected';

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerDate = exports.setServerBias = void 0;
const acebase_core_1 = require("acebase-core");
const performance_1 = require("./performance");
const time = {
    serverBias: 0,
    localBias: 0,
    lastTime: Date.now(),
    lastPerf: performance_1.default.now(),
    get bias() { return this.serverBias + this.localBias; },
};
function biasChanged() {
    console.log(`Bias changed. server bias = ${time.serverBias}ms, local bias = ${time.localBias}ms`);
    acebase_core_1.ID.timeBias = time.bias; // undocumented
}
// Keep monitoring local time for changes, adjust local bias accordingly
const interval = 10000; // 10s
function checkLocalTime() {
    // console.log('Checking time...');
    const now = Date.now(), // eg 20:00:00
    perf = performance_1.default.now(), msPassed = perf - time.lastPerf, // now - time.lastTime, //
    expected = time.lastTime + Math.round(msPassed), // 19:00:00
    diff = expected - now; // -1h
    if (Math.abs(diff) > 1) {
        console.log(`Local time changed. diff = ${diff}ms`);
        time.localBias += diff;
        biasChanged();
    }
    time.lastTime = now;
    time.lastPerf = perf;
    scheduleLocalTimeCheck();
}
function scheduleLocalTimeCheck() {
    const timeout = setTimeout(checkLocalTime, interval);
    timeout.unref && timeout.unref(); // Don't delay exiting the main process when the event loop is empty
}
scheduleLocalTimeCheck();
function setServerBias(bias) {
    if (typeof bias === 'number') {
        time.serverBias = bias;
        time.localBias = 0;
        biasChanged();
    }
}
exports.setServerBias = setServerBias;
class ServerDate extends Date {
    constructor() {
        const biasedTime = Date.now() + time.bias;
        super(biasedTime);
    }
}
exports.ServerDate = ServerDate;

},{"./performance":8,"acebase-core":30}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AceBaseUser = void 0;
class AceBaseUser {
    constructor(user) {
        var _a, _b, _c;
        Object.assign(this, user);
        if (!user.uid) {
            throw new Error('User details is missing required uid field');
        }
        this.uid = user.uid;
        this.displayName = (_a = user.displayName) !== null && _a !== void 0 ? _a : 'unknown';
        this.created = (_b = user.created) !== null && _b !== void 0 ? _b : new Date(0);
        this.settings = (_c = user.settings) !== null && _c !== void 0 ? _c : {};
    }
}
exports.AceBaseUser = AceBaseUser;
// export class AceBaseAuthResult {
//     success: boolean;
//     reason?: { code: string, message: string };
//     constructor(result: { success: boolean; reason?: { code: string, message: string }}) {
//         this.success = result.success;
//         if (!result.success) {
//             this.reason = result.reason;
//         }
//     }
// }

},{}],14:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],15:[function(require,module,exports){

},{}],16:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":14,"buffer":16,"ieee754":17}],17:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],18:[function(require,module,exports){
/*!
 * Socket.IO v4.5.3
 * (c) 2014-2022 Guillermo Rauch
 * Released under the MIT License.
 */
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).io=e()}(this,(function(){"use strict";function t(e){return t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},t(e)}function e(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function n(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function r(t,e,r){return e&&n(t.prototype,e),r&&n(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t}function i(){return i=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t},i.apply(this,arguments)}function o(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&a(t,e)}function s(t){return s=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},s(t)}function a(t,e){return a=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},a(t,e)}function c(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}function u(t,e,n){return u=c()?Reflect.construct.bind():function(t,e,n){var r=[null];r.push.apply(r,e);var i=new(Function.bind.apply(t,r));return n&&a(i,n.prototype),i},u.apply(null,arguments)}function h(t){var e="function"==typeof Map?new Map:void 0;return h=function(t){if(null===t||(n=t,-1===Function.toString.call(n).indexOf("[native code]")))return t;var n;if("function"!=typeof t)throw new TypeError("Super expression must either be null or a function");if(void 0!==e){if(e.has(t))return e.get(t);e.set(t,r)}function r(){return u(t,arguments,s(this).constructor)}return r.prototype=Object.create(t.prototype,{constructor:{value:r,enumerable:!1,writable:!0,configurable:!0}}),a(r,t)},h(t)}function f(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function l(t,e){if(e&&("object"==typeof e||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return f(t)}function p(t){var e=c();return function(){var n,r=s(t);if(e){var i=s(this).constructor;n=Reflect.construct(r,arguments,i)}else n=r.apply(this,arguments);return l(this,n)}}function d(t,e){for(;!Object.prototype.hasOwnProperty.call(t,e)&&null!==(t=s(t)););return t}function y(){return y="undefined"!=typeof Reflect&&Reflect.get?Reflect.get.bind():function(t,e,n){var r=d(t,e);if(r){var i=Object.getOwnPropertyDescriptor(r,e);return i.get?i.get.call(arguments.length<3?t:n):i.value}},y.apply(this,arguments)}function v(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function g(t,e){var n="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!n){if(Array.isArray(t)||(n=function(t,e){if(t){if("string"==typeof t)return v(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?v(t,e):void 0}}(t))||e&&t&&"number"==typeof t.length){n&&(t=n);var r=0,i=function(){};return{s:i,n:function(){return r>=t.length?{done:!0}:{done:!1,value:t[r++]}},e:function(t){throw t},f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var o,s=!0,a=!1;return{s:function(){n=n.call(t)},n:function(){var t=n.next();return s=t.done,t},e:function(t){a=!0,o=t},f:function(){try{s||null==n.return||n.return()}finally{if(a)throw o}}}}var m=Object.create(null);m.open="0",m.close="1",m.ping="2",m.pong="3",m.message="4",m.upgrade="5",m.noop="6";var b=Object.create(null);Object.keys(m).forEach((function(t){b[m[t]]=t}));for(var k={type:"error",data:"parser error"},w="function"==typeof Blob||"undefined"!=typeof Blob&&"[object BlobConstructor]"===Object.prototype.toString.call(Blob),_="function"==typeof ArrayBuffer,O=function(t,e,n){var r,i=t.type,o=t.data;return w&&o instanceof Blob?e?n(o):E(o,n):_&&(o instanceof ArrayBuffer||(r=o,"function"==typeof ArrayBuffer.isView?ArrayBuffer.isView(r):r&&r.buffer instanceof ArrayBuffer))?e?n(o):E(new Blob([o]),n):n(m[i]+(o||""))},E=function(t,e){var n=new FileReader;return n.onload=function(){var t=n.result.split(",")[1];e("b"+t)},n.readAsDataURL(t)},A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",R="undefined"==typeof Uint8Array?[]:new Uint8Array(256),T=0;T<A.length;T++)R[A.charCodeAt(T)]=T;var C="function"==typeof ArrayBuffer,B=function(t,e){if("string"!=typeof t)return{type:"message",data:N(t,e)};var n=t.charAt(0);return"b"===n?{type:"message",data:S(t.substring(1),e)}:b[n]?t.length>1?{type:b[n],data:t.substring(1)}:{type:b[n]}:k},S=function(t,e){if(C){var n=function(t){var e,n,r,i,o,s=.75*t.length,a=t.length,c=0;"="===t[t.length-1]&&(s--,"="===t[t.length-2]&&s--);var u=new ArrayBuffer(s),h=new Uint8Array(u);for(e=0;e<a;e+=4)n=R[t.charCodeAt(e)],r=R[t.charCodeAt(e+1)],i=R[t.charCodeAt(e+2)],o=R[t.charCodeAt(e+3)],h[c++]=n<<2|r>>4,h[c++]=(15&r)<<4|i>>2,h[c++]=(3&i)<<6|63&o;return u}(t);return N(n,e)}return{base64:!0,data:t}},N=function(t,e){return"blob"===e&&t instanceof ArrayBuffer?new Blob([t]):t},x=String.fromCharCode(30);function L(t){if(t)return function(t){for(var e in L.prototype)t[e]=L.prototype[e];return t}(t)}L.prototype.on=L.prototype.addEventListener=function(t,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+t]=this._callbacks["$"+t]||[]).push(e),this},L.prototype.once=function(t,e){function n(){this.off(t,n),e.apply(this,arguments)}return n.fn=e,this.on(t,n),this},L.prototype.off=L.prototype.removeListener=L.prototype.removeAllListeners=L.prototype.removeEventListener=function(t,e){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var n,r=this._callbacks["$"+t];if(!r)return this;if(1==arguments.length)return delete this._callbacks["$"+t],this;for(var i=0;i<r.length;i++)if((n=r[i])===e||n.fn===e){r.splice(i,1);break}return 0===r.length&&delete this._callbacks["$"+t],this},L.prototype.emit=function(t){this._callbacks=this._callbacks||{};for(var e=new Array(arguments.length-1),n=this._callbacks["$"+t],r=1;r<arguments.length;r++)e[r-1]=arguments[r];if(n){r=0;for(var i=(n=n.slice(0)).length;r<i;++r)n[r].apply(this,e)}return this},L.prototype.emitReserved=L.prototype.emit,L.prototype.listeners=function(t){return this._callbacks=this._callbacks||{},this._callbacks["$"+t]||[]},L.prototype.hasListeners=function(t){return!!this.listeners(t).length};var P="undefined"!=typeof self?self:"undefined"!=typeof window?window:Function("return this")();function j(t){for(var e=arguments.length,n=new Array(e>1?e-1:0),r=1;r<e;r++)n[r-1]=arguments[r];return n.reduce((function(e,n){return t.hasOwnProperty(n)&&(e[n]=t[n]),e}),{})}var q=setTimeout,I=clearTimeout;function D(t,e){e.useNativeTimers?(t.setTimeoutFn=q.bind(P),t.clearTimeoutFn=I.bind(P)):(t.setTimeoutFn=setTimeout.bind(P),t.clearTimeoutFn=clearTimeout.bind(P))}var F,M=function(t){o(i,t);var n=p(i);function i(t,r,o){var s;return e(this,i),(s=n.call(this,t)).description=r,s.context=o,s.type="TransportError",s}return r(i)}(h(Error)),U=function(t){o(i,t);var n=p(i);function i(t){var r;return e(this,i),(r=n.call(this)).writable=!1,D(f(r),t),r.opts=t,r.query=t.query,r.readyState="",r.socket=t.socket,r}return r(i,[{key:"onError",value:function(t,e,n){return y(s(i.prototype),"emitReserved",this).call(this,"error",new M(t,e,n)),this}},{key:"open",value:function(){return"closed"!==this.readyState&&""!==this.readyState||(this.readyState="opening",this.doOpen()),this}},{key:"close",value:function(){return"opening"!==this.readyState&&"open"!==this.readyState||(this.doClose(),this.onClose()),this}},{key:"send",value:function(t){"open"===this.readyState&&this.write(t)}},{key:"onOpen",value:function(){this.readyState="open",this.writable=!0,y(s(i.prototype),"emitReserved",this).call(this,"open")}},{key:"onData",value:function(t){var e=B(t,this.socket.binaryType);this.onPacket(e)}},{key:"onPacket",value:function(t){y(s(i.prototype),"emitReserved",this).call(this,"packet",t)}},{key:"onClose",value:function(t){this.readyState="closed",y(s(i.prototype),"emitReserved",this).call(this,"close",t)}}]),i}(L),V="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""),H={},K=0,Y=0;function z(t){var e="";do{e=V[t%64]+e,t=Math.floor(t/64)}while(t>0);return e}function W(){var t=z(+new Date);return t!==F?(K=0,F=t):t+"."+z(K++)}for(;Y<64;Y++)H[V[Y]]=Y;function $(t){var e="";for(var n in t)t.hasOwnProperty(n)&&(e.length&&(e+="&"),e+=encodeURIComponent(n)+"="+encodeURIComponent(t[n]));return e}function J(t){for(var e={},n=t.split("&"),r=0,i=n.length;r<i;r++){var o=n[r].split("=");e[decodeURIComponent(o[0])]=decodeURIComponent(o[1])}return e}var X=!1;try{X="undefined"!=typeof XMLHttpRequest&&"withCredentials"in new XMLHttpRequest}catch(t){}var G=X;function Q(t){var e=t.xdomain;try{if("undefined"!=typeof XMLHttpRequest&&(!e||G))return new XMLHttpRequest}catch(t){}if(!e)try{return new(P[["Active"].concat("Object").join("X")])("Microsoft.XMLHTTP")}catch(t){}}function Z(){}var tt=null!=new Q({xdomain:!1}).responseType,et=function(t){o(s,t);var n=p(s);function s(t){var r;if(e(this,s),(r=n.call(this,t)).polling=!1,"undefined"!=typeof location){var i="https:"===location.protocol,o=location.port;o||(o=i?"443":"80"),r.xd="undefined"!=typeof location&&t.hostname!==location.hostname||o!==t.port,r.xs=t.secure!==i}var a=t&&t.forceBase64;return r.supportsBinary=tt&&!a,r}return r(s,[{key:"name",get:function(){return"polling"}},{key:"doOpen",value:function(){this.poll()}},{key:"pause",value:function(t){var e=this;this.readyState="pausing";var n=function(){e.readyState="paused",t()};if(this.polling||!this.writable){var r=0;this.polling&&(r++,this.once("pollComplete",(function(){--r||n()}))),this.writable||(r++,this.once("drain",(function(){--r||n()})))}else n()}},{key:"poll",value:function(){this.polling=!0,this.doPoll(),this.emitReserved("poll")}},{key:"onData",value:function(t){var e=this;(function(t,e){for(var n=t.split(x),r=[],i=0;i<n.length;i++){var o=B(n[i],e);if(r.push(o),"error"===o.type)break}return r})(t,this.socket.binaryType).forEach((function(t){if("opening"===e.readyState&&"open"===t.type&&e.onOpen(),"close"===t.type)return e.onClose({description:"transport closed by the server"}),!1;e.onPacket(t)})),"closed"!==this.readyState&&(this.polling=!1,this.emitReserved("pollComplete"),"open"===this.readyState&&this.poll())}},{key:"doClose",value:function(){var t=this,e=function(){t.write([{type:"close"}])};"open"===this.readyState?e():this.once("open",e)}},{key:"write",value:function(t){var e=this;this.writable=!1,function(t,e){var n=t.length,r=new Array(n),i=0;t.forEach((function(t,o){O(t,!1,(function(t){r[o]=t,++i===n&&e(r.join(x))}))}))}(t,(function(t){e.doWrite(t,(function(){e.writable=!0,e.emitReserved("drain")}))}))}},{key:"uri",value:function(){var t=this.query||{},e=this.opts.secure?"https":"http",n="";!1!==this.opts.timestampRequests&&(t[this.opts.timestampParam]=W()),this.supportsBinary||t.sid||(t.b64=1),this.opts.port&&("https"===e&&443!==Number(this.opts.port)||"http"===e&&80!==Number(this.opts.port))&&(n=":"+this.opts.port);var r=$(t);return e+"://"+(-1!==this.opts.hostname.indexOf(":")?"["+this.opts.hostname+"]":this.opts.hostname)+n+this.opts.path+(r.length?"?"+r:"")}},{key:"request",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return i(t,{xd:this.xd,xs:this.xs},this.opts),new nt(this.uri(),t)}},{key:"doWrite",value:function(t,e){var n=this,r=this.request({method:"POST",data:t});r.on("success",e),r.on("error",(function(t,e){n.onError("xhr post error",t,e)}))}},{key:"doPoll",value:function(){var t=this,e=this.request();e.on("data",this.onData.bind(this)),e.on("error",(function(e,n){t.onError("xhr poll error",e,n)})),this.pollXhr=e}}]),s}(U),nt=function(t){o(i,t);var n=p(i);function i(t,r){var o;return e(this,i),D(f(o=n.call(this)),r),o.opts=r,o.method=r.method||"GET",o.uri=t,o.async=!1!==r.async,o.data=void 0!==r.data?r.data:null,o.create(),o}return r(i,[{key:"create",value:function(){var t=this,e=j(this.opts,"agent","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","autoUnref");e.xdomain=!!this.opts.xd,e.xscheme=!!this.opts.xs;var n=this.xhr=new Q(e);try{n.open(this.method,this.uri,this.async);try{if(this.opts.extraHeaders)for(var r in n.setDisableHeaderCheck&&n.setDisableHeaderCheck(!0),this.opts.extraHeaders)this.opts.extraHeaders.hasOwnProperty(r)&&n.setRequestHeader(r,this.opts.extraHeaders[r])}catch(t){}if("POST"===this.method)try{n.setRequestHeader("Content-type","text/plain;charset=UTF-8")}catch(t){}try{n.setRequestHeader("Accept","*/*")}catch(t){}"withCredentials"in n&&(n.withCredentials=this.opts.withCredentials),this.opts.requestTimeout&&(n.timeout=this.opts.requestTimeout),n.onreadystatechange=function(){4===n.readyState&&(200===n.status||1223===n.status?t.onLoad():t.setTimeoutFn((function(){t.onError("number"==typeof n.status?n.status:0)}),0))},n.send(this.data)}catch(e){return void this.setTimeoutFn((function(){t.onError(e)}),0)}"undefined"!=typeof document&&(this.index=i.requestsCount++,i.requests[this.index]=this)}},{key:"onError",value:function(t){this.emitReserved("error",t,this.xhr),this.cleanup(!0)}},{key:"cleanup",value:function(t){if(void 0!==this.xhr&&null!==this.xhr){if(this.xhr.onreadystatechange=Z,t)try{this.xhr.abort()}catch(t){}"undefined"!=typeof document&&delete i.requests[this.index],this.xhr=null}}},{key:"onLoad",value:function(){var t=this.xhr.responseText;null!==t&&(this.emitReserved("data",t),this.emitReserved("success"),this.cleanup())}},{key:"abort",value:function(){this.cleanup()}}]),i}(L);if(nt.requestsCount=0,nt.requests={},"undefined"!=typeof document)if("function"==typeof attachEvent)attachEvent("onunload",rt);else if("function"==typeof addEventListener){addEventListener("onpagehide"in P?"pagehide":"unload",rt,!1)}function rt(){for(var t in nt.requests)nt.requests.hasOwnProperty(t)&&nt.requests[t].abort()}var it="function"==typeof Promise&&"function"==typeof Promise.resolve?function(t){return Promise.resolve().then(t)}:function(t,e){return e(t,0)},ot=P.WebSocket||P.MozWebSocket,st="undefined"!=typeof navigator&&"string"==typeof navigator.product&&"reactnative"===navigator.product.toLowerCase(),at=function(t){o(i,t);var n=p(i);function i(t){var r;return e(this,i),(r=n.call(this,t)).supportsBinary=!t.forceBase64,r}return r(i,[{key:"name",get:function(){return"websocket"}},{key:"doOpen",value:function(){if(this.check()){var t=this.uri(),e=this.opts.protocols,n=st?{}:j(this.opts,"agent","perMessageDeflate","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","localAddress","protocolVersion","origin","maxPayload","family","checkServerIdentity");this.opts.extraHeaders&&(n.headers=this.opts.extraHeaders);try{this.ws=st?new ot(t,e,n):e?new ot(t,e):new ot(t)}catch(t){return this.emitReserved("error",t)}this.ws.binaryType=this.socket.binaryType||"arraybuffer",this.addEventListeners()}}},{key:"addEventListeners",value:function(){var t=this;this.ws.onopen=function(){t.opts.autoUnref&&t.ws._socket.unref(),t.onOpen()},this.ws.onclose=function(e){return t.onClose({description:"websocket connection closed",context:e})},this.ws.onmessage=function(e){return t.onData(e.data)},this.ws.onerror=function(e){return t.onError("websocket error",e)}}},{key:"write",value:function(t){var e=this;this.writable=!1;for(var n=function(n){var r=t[n],i=n===t.length-1;O(r,e.supportsBinary,(function(t){try{e.ws.send(t)}catch(t){}i&&it((function(){e.writable=!0,e.emitReserved("drain")}),e.setTimeoutFn)}))},r=0;r<t.length;r++)n(r)}},{key:"doClose",value:function(){void 0!==this.ws&&(this.ws.close(),this.ws=null)}},{key:"uri",value:function(){var t=this.query||{},e=this.opts.secure?"wss":"ws",n="";this.opts.port&&("wss"===e&&443!==Number(this.opts.port)||"ws"===e&&80!==Number(this.opts.port))&&(n=":"+this.opts.port),this.opts.timestampRequests&&(t[this.opts.timestampParam]=W()),this.supportsBinary||(t.b64=1);var r=$(t);return e+"://"+(-1!==this.opts.hostname.indexOf(":")?"["+this.opts.hostname+"]":this.opts.hostname)+n+this.opts.path+(r.length?"?"+r:"")}},{key:"check",value:function(){return!!ot}}]),i}(U),ct={websocket:at,polling:et},ut=/^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,ht=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];function ft(t){var e=t,n=t.indexOf("["),r=t.indexOf("]");-1!=n&&-1!=r&&(t=t.substring(0,n)+t.substring(n,r).replace(/:/g,";")+t.substring(r,t.length));for(var i,o,s=ut.exec(t||""),a={},c=14;c--;)a[ht[c]]=s[c]||"";return-1!=n&&-1!=r&&(a.source=e,a.host=a.host.substring(1,a.host.length-1).replace(/;/g,":"),a.authority=a.authority.replace("[","").replace("]","").replace(/;/g,":"),a.ipv6uri=!0),a.pathNames=function(t,e){var n=/\/{2,9}/g,r=e.replace(n,"/").split("/");"/"!=e.slice(0,1)&&0!==e.length||r.splice(0,1);"/"==e.slice(-1)&&r.splice(r.length-1,1);return r}(0,a.path),a.queryKey=(i=a.query,o={},i.replace(/(?:^|&)([^&=]*)=?([^&]*)/g,(function(t,e,n){e&&(o[e]=n)})),o),a}var lt=function(n){o(a,n);var s=p(a);function a(n){var r,o=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return e(this,a),r=s.call(this),n&&"object"===t(n)&&(o=n,n=null),n?(n=ft(n),o.hostname=n.host,o.secure="https"===n.protocol||"wss"===n.protocol,o.port=n.port,n.query&&(o.query=n.query)):o.host&&(o.hostname=ft(o.host).host),D(f(r),o),r.secure=null!=o.secure?o.secure:"undefined"!=typeof location&&"https:"===location.protocol,o.hostname&&!o.port&&(o.port=r.secure?"443":"80"),r.hostname=o.hostname||("undefined"!=typeof location?location.hostname:"localhost"),r.port=o.port||("undefined"!=typeof location&&location.port?location.port:r.secure?"443":"80"),r.transports=o.transports||["polling","websocket"],r.readyState="",r.writeBuffer=[],r.prevBufferLen=0,r.opts=i({path:"/engine.io",agent:!1,withCredentials:!1,upgrade:!0,timestampParam:"t",rememberUpgrade:!1,rejectUnauthorized:!0,perMessageDeflate:{threshold:1024},transportOptions:{},closeOnBeforeunload:!0},o),r.opts.path=r.opts.path.replace(/\/$/,"")+"/","string"==typeof r.opts.query&&(r.opts.query=J(r.opts.query)),r.id=null,r.upgrades=null,r.pingInterval=null,r.pingTimeout=null,r.pingTimeoutTimer=null,"function"==typeof addEventListener&&(r.opts.closeOnBeforeunload&&(r.beforeunloadEventListener=function(){r.transport&&(r.transport.removeAllListeners(),r.transport.close())},addEventListener("beforeunload",r.beforeunloadEventListener,!1)),"localhost"!==r.hostname&&(r.offlineEventListener=function(){r.onClose("transport close",{description:"network connection lost"})},addEventListener("offline",r.offlineEventListener,!1))),r.open(),r}return r(a,[{key:"createTransport",value:function(t){var e=i({},this.opts.query);e.EIO=4,e.transport=t,this.id&&(e.sid=this.id);var n=i({},this.opts.transportOptions[t],this.opts,{query:e,socket:this,hostname:this.hostname,secure:this.secure,port:this.port});return new ct[t](n)}},{key:"open",value:function(){var t,e=this;if(this.opts.rememberUpgrade&&a.priorWebsocketSuccess&&-1!==this.transports.indexOf("websocket"))t="websocket";else{if(0===this.transports.length)return void this.setTimeoutFn((function(){e.emitReserved("error","No transports available")}),0);t=this.transports[0]}this.readyState="opening";try{t=this.createTransport(t)}catch(t){return this.transports.shift(),void this.open()}t.open(),this.setTransport(t)}},{key:"setTransport",value:function(t){var e=this;this.transport&&this.transport.removeAllListeners(),this.transport=t,t.on("drain",this.onDrain.bind(this)).on("packet",this.onPacket.bind(this)).on("error",this.onError.bind(this)).on("close",(function(t){return e.onClose("transport close",t)}))}},{key:"probe",value:function(t){var e=this,n=this.createTransport(t),r=!1;a.priorWebsocketSuccess=!1;var i=function(){r||(n.send([{type:"ping",data:"probe"}]),n.once("packet",(function(t){if(!r)if("pong"===t.type&&"probe"===t.data){if(e.upgrading=!0,e.emitReserved("upgrading",n),!n)return;a.priorWebsocketSuccess="websocket"===n.name,e.transport.pause((function(){r||"closed"!==e.readyState&&(f(),e.setTransport(n),n.send([{type:"upgrade"}]),e.emitReserved("upgrade",n),n=null,e.upgrading=!1,e.flush())}))}else{var i=new Error("probe error");i.transport=n.name,e.emitReserved("upgradeError",i)}})))};function o(){r||(r=!0,f(),n.close(),n=null)}var s=function(t){var r=new Error("probe error: "+t);r.transport=n.name,o(),e.emitReserved("upgradeError",r)};function c(){s("transport closed")}function u(){s("socket closed")}function h(t){n&&t.name!==n.name&&o()}var f=function(){n.removeListener("open",i),n.removeListener("error",s),n.removeListener("close",c),e.off("close",u),e.off("upgrading",h)};n.once("open",i),n.once("error",s),n.once("close",c),this.once("close",u),this.once("upgrading",h),n.open()}},{key:"onOpen",value:function(){if(this.readyState="open",a.priorWebsocketSuccess="websocket"===this.transport.name,this.emitReserved("open"),this.flush(),"open"===this.readyState&&this.opts.upgrade&&this.transport.pause)for(var t=0,e=this.upgrades.length;t<e;t++)this.probe(this.upgrades[t])}},{key:"onPacket",value:function(t){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState)switch(this.emitReserved("packet",t),this.emitReserved("heartbeat"),t.type){case"open":this.onHandshake(JSON.parse(t.data));break;case"ping":this.resetPingTimeout(),this.sendPacket("pong"),this.emitReserved("ping"),this.emitReserved("pong");break;case"error":var e=new Error("server error");e.code=t.data,this.onError(e);break;case"message":this.emitReserved("data",t.data),this.emitReserved("message",t.data)}}},{key:"onHandshake",value:function(t){this.emitReserved("handshake",t),this.id=t.sid,this.transport.query.sid=t.sid,this.upgrades=this.filterUpgrades(t.upgrades),this.pingInterval=t.pingInterval,this.pingTimeout=t.pingTimeout,this.maxPayload=t.maxPayload,this.onOpen(),"closed"!==this.readyState&&this.resetPingTimeout()}},{key:"resetPingTimeout",value:function(){var t=this;this.clearTimeoutFn(this.pingTimeoutTimer),this.pingTimeoutTimer=this.setTimeoutFn((function(){t.onClose("ping timeout")}),this.pingInterval+this.pingTimeout),this.opts.autoUnref&&this.pingTimeoutTimer.unref()}},{key:"onDrain",value:function(){this.writeBuffer.splice(0,this.prevBufferLen),this.prevBufferLen=0,0===this.writeBuffer.length?this.emitReserved("drain"):this.flush()}},{key:"flush",value:function(){if("closed"!==this.readyState&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length){var t=this.getWritablePackets();this.transport.send(t),this.prevBufferLen=t.length,this.emitReserved("flush")}}},{key:"getWritablePackets",value:function(){if(!(this.maxPayload&&"polling"===this.transport.name&&this.writeBuffer.length>1))return this.writeBuffer;for(var t,e=1,n=0;n<this.writeBuffer.length;n++){var r=this.writeBuffer[n].data;if(r&&(e+="string"==typeof(t=r)?function(t){for(var e=0,n=0,r=0,i=t.length;r<i;r++)(e=t.charCodeAt(r))<128?n+=1:e<2048?n+=2:e<55296||e>=57344?n+=3:(r++,n+=4);return n}(t):Math.ceil(1.33*(t.byteLength||t.size))),n>0&&e>this.maxPayload)return this.writeBuffer.slice(0,n);e+=2}return this.writeBuffer}},{key:"write",value:function(t,e,n){return this.sendPacket("message",t,e,n),this}},{key:"send",value:function(t,e,n){return this.sendPacket("message",t,e,n),this}},{key:"sendPacket",value:function(t,e,n,r){if("function"==typeof e&&(r=e,e=void 0),"function"==typeof n&&(r=n,n=null),"closing"!==this.readyState&&"closed"!==this.readyState){(n=n||{}).compress=!1!==n.compress;var i={type:t,data:e,options:n};this.emitReserved("packetCreate",i),this.writeBuffer.push(i),r&&this.once("flush",r),this.flush()}}},{key:"close",value:function(){var t=this,e=function(){t.onClose("forced close"),t.transport.close()},n=function n(){t.off("upgrade",n),t.off("upgradeError",n),e()},r=function(){t.once("upgrade",n),t.once("upgradeError",n)};return"opening"!==this.readyState&&"open"!==this.readyState||(this.readyState="closing",this.writeBuffer.length?this.once("drain",(function(){t.upgrading?r():e()})):this.upgrading?r():e()),this}},{key:"onError",value:function(t){a.priorWebsocketSuccess=!1,this.emitReserved("error",t),this.onClose("transport error",t)}},{key:"onClose",value:function(t,e){"opening"!==this.readyState&&"open"!==this.readyState&&"closing"!==this.readyState||(this.clearTimeoutFn(this.pingTimeoutTimer),this.transport.removeAllListeners("close"),this.transport.close(),this.transport.removeAllListeners(),"function"==typeof removeEventListener&&(removeEventListener("beforeunload",this.beforeunloadEventListener,!1),removeEventListener("offline",this.offlineEventListener,!1)),this.readyState="closed",this.id=null,this.emitReserved("close",t,e),this.writeBuffer=[],this.prevBufferLen=0)}},{key:"filterUpgrades",value:function(t){for(var e=[],n=0,r=t.length;n<r;n++)~this.transports.indexOf(t[n])&&e.push(t[n]);return e}}]),a}(L);lt.protocol=4,lt.protocol;var pt="function"==typeof ArrayBuffer,dt=Object.prototype.toString,yt="function"==typeof Blob||"undefined"!=typeof Blob&&"[object BlobConstructor]"===dt.call(Blob),vt="function"==typeof File||"undefined"!=typeof File&&"[object FileConstructor]"===dt.call(File);function gt(t){return pt&&(t instanceof ArrayBuffer||function(t){return"function"==typeof ArrayBuffer.isView?ArrayBuffer.isView(t):t.buffer instanceof ArrayBuffer}(t))||yt&&t instanceof Blob||vt&&t instanceof File}function mt(e,n){if(!e||"object"!==t(e))return!1;if(Array.isArray(e)){for(var r=0,i=e.length;r<i;r++)if(mt(e[r]))return!0;return!1}if(gt(e))return!0;if(e.toJSON&&"function"==typeof e.toJSON&&1===arguments.length)return mt(e.toJSON(),!0);for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)&&mt(e[o]))return!0;return!1}function bt(t){var e=[],n=t.data,r=t;return r.data=kt(n,e),r.attachments=e.length,{packet:r,buffers:e}}function kt(e,n){if(!e)return e;if(gt(e)){var r={_placeholder:!0,num:n.length};return n.push(e),r}if(Array.isArray(e)){for(var i=new Array(e.length),o=0;o<e.length;o++)i[o]=kt(e[o],n);return i}if("object"===t(e)&&!(e instanceof Date)){var s={};for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&(s[a]=kt(e[a],n));return s}return e}function wt(t,e){return t.data=_t(t.data,e),t.attachments=void 0,t}function _t(e,n){if(!e)return e;if(e&&e._placeholder)return n[e.num];if(Array.isArray(e))for(var r=0;r<e.length;r++)e[r]=_t(e[r],n);else if("object"===t(e))for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&(e[i]=_t(e[i],n));return e}var Ot;!function(t){t[t.CONNECT=0]="CONNECT",t[t.DISCONNECT=1]="DISCONNECT",t[t.EVENT=2]="EVENT",t[t.ACK=3]="ACK",t[t.CONNECT_ERROR=4]="CONNECT_ERROR",t[t.BINARY_EVENT=5]="BINARY_EVENT",t[t.BINARY_ACK=6]="BINARY_ACK"}(Ot||(Ot={}));var Et=function(){function t(n){e(this,t),this.replacer=n}return r(t,[{key:"encode",value:function(t){return t.type!==Ot.EVENT&&t.type!==Ot.ACK||!mt(t)?[this.encodeAsString(t)]:(t.type=t.type===Ot.EVENT?Ot.BINARY_EVENT:Ot.BINARY_ACK,this.encodeAsBinary(t))}},{key:"encodeAsString",value:function(t){var e=""+t.type;return t.type!==Ot.BINARY_EVENT&&t.type!==Ot.BINARY_ACK||(e+=t.attachments+"-"),t.nsp&&"/"!==t.nsp&&(e+=t.nsp+","),null!=t.id&&(e+=t.id),null!=t.data&&(e+=JSON.stringify(t.data,this.replacer)),e}},{key:"encodeAsBinary",value:function(t){var e=bt(t),n=this.encodeAsString(e.packet),r=e.buffers;return r.unshift(n),r}}]),t}(),At=function(n){o(a,n);var i=p(a);function a(t){var n;return e(this,a),(n=i.call(this)).reviver=t,n}return r(a,[{key:"add",value:function(t){var e;if("string"==typeof t)(e=this.decodeString(t)).type===Ot.BINARY_EVENT||e.type===Ot.BINARY_ACK?(this.reconstructor=new Rt(e),0===e.attachments&&y(s(a.prototype),"emitReserved",this).call(this,"decoded",e)):y(s(a.prototype),"emitReserved",this).call(this,"decoded",e);else{if(!gt(t)&&!t.base64)throw new Error("Unknown type: "+t);if(!this.reconstructor)throw new Error("got binary data when not reconstructing a packet");(e=this.reconstructor.takeBinaryData(t))&&(this.reconstructor=null,y(s(a.prototype),"emitReserved",this).call(this,"decoded",e))}}},{key:"decodeString",value:function(t){var e=0,n={type:Number(t.charAt(0))};if(void 0===Ot[n.type])throw new Error("unknown packet type "+n.type);if(n.type===Ot.BINARY_EVENT||n.type===Ot.BINARY_ACK){for(var r=e+1;"-"!==t.charAt(++e)&&e!=t.length;);var i=t.substring(r,e);if(i!=Number(i)||"-"!==t.charAt(e))throw new Error("Illegal attachments");n.attachments=Number(i)}if("/"===t.charAt(e+1)){for(var o=e+1;++e;){if(","===t.charAt(e))break;if(e===t.length)break}n.nsp=t.substring(o,e)}else n.nsp="/";var s=t.charAt(e+1);if(""!==s&&Number(s)==s){for(var c=e+1;++e;){var u=t.charAt(e);if(null==u||Number(u)!=u){--e;break}if(e===t.length)break}n.id=Number(t.substring(c,e+1))}if(t.charAt(++e)){var h=this.tryParse(t.substr(e));if(!a.isPayloadValid(n.type,h))throw new Error("invalid payload");n.data=h}return n}},{key:"tryParse",value:function(t){try{return JSON.parse(t,this.reviver)}catch(t){return!1}}},{key:"destroy",value:function(){this.reconstructor&&this.reconstructor.finishedReconstruction()}}],[{key:"isPayloadValid",value:function(e,n){switch(e){case Ot.CONNECT:return"object"===t(n);case Ot.DISCONNECT:return void 0===n;case Ot.CONNECT_ERROR:return"string"==typeof n||"object"===t(n);case Ot.EVENT:case Ot.BINARY_EVENT:return Array.isArray(n)&&n.length>0;case Ot.ACK:case Ot.BINARY_ACK:return Array.isArray(n)}}}]),a}(L),Rt=function(){function t(n){e(this,t),this.packet=n,this.buffers=[],this.reconPack=n}return r(t,[{key:"takeBinaryData",value:function(t){if(this.buffers.push(t),this.buffers.length===this.reconPack.attachments){var e=wt(this.reconPack,this.buffers);return this.finishedReconstruction(),e}return null}},{key:"finishedReconstruction",value:function(){this.reconPack=null,this.buffers=[]}}]),t}(),Tt=Object.freeze({__proto__:null,protocol:5,get PacketType(){return Ot},Encoder:Et,Decoder:At});function Ct(t,e,n){return t.on(e,n),function(){t.off(e,n)}}var Bt=Object.freeze({connect:1,connect_error:1,disconnect:1,disconnecting:1,newListener:1,removeListener:1}),St=function(t){o(i,t);var n=p(i);function i(t,r,o){var s;return e(this,i),(s=n.call(this)).connected=!1,s.receiveBuffer=[],s.sendBuffer=[],s.ids=0,s.acks={},s.flags={},s.io=t,s.nsp=r,o&&o.auth&&(s.auth=o.auth),s.io._autoConnect&&s.open(),s}return r(i,[{key:"disconnected",get:function(){return!this.connected}},{key:"subEvents",value:function(){if(!this.subs){var t=this.io;this.subs=[Ct(t,"open",this.onopen.bind(this)),Ct(t,"packet",this.onpacket.bind(this)),Ct(t,"error",this.onerror.bind(this)),Ct(t,"close",this.onclose.bind(this))]}}},{key:"active",get:function(){return!!this.subs}},{key:"connect",value:function(){return this.connected||(this.subEvents(),this.io._reconnecting||this.io.open(),"open"===this.io._readyState&&this.onopen()),this}},{key:"open",value:function(){return this.connect()}},{key:"send",value:function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];return e.unshift("message"),this.emit.apply(this,e),this}},{key:"emit",value:function(t){if(Bt.hasOwnProperty(t))throw new Error('"'+t.toString()+'" is a reserved event name');for(var e=arguments.length,n=new Array(e>1?e-1:0),r=1;r<e;r++)n[r-1]=arguments[r];n.unshift(t);var i={type:Ot.EVENT,data:n,options:{}};if(i.options.compress=!1!==this.flags.compress,"function"==typeof n[n.length-1]){var o=this.ids++,s=n.pop();this._registerAckCallback(o,s),i.id=o}var a=this.io.engine&&this.io.engine.transport&&this.io.engine.transport.writable,c=this.flags.volatile&&(!a||!this.connected);return c||(this.connected?(this.notifyOutgoingListeners(i),this.packet(i)):this.sendBuffer.push(i)),this.flags={},this}},{key:"_registerAckCallback",value:function(t,e){var n=this,r=this.flags.timeout;if(void 0!==r){var i=this.io.setTimeoutFn((function(){delete n.acks[t];for(var r=0;r<n.sendBuffer.length;r++)n.sendBuffer[r].id===t&&n.sendBuffer.splice(r,1);e.call(n,new Error("operation has timed out"))}),r);this.acks[t]=function(){n.io.clearTimeoutFn(i);for(var t=arguments.length,r=new Array(t),o=0;o<t;o++)r[o]=arguments[o];e.apply(n,[null].concat(r))}}else this.acks[t]=e}},{key:"packet",value:function(t){t.nsp=this.nsp,this.io._packet(t)}},{key:"onopen",value:function(){var t=this;"function"==typeof this.auth?this.auth((function(e){t.packet({type:Ot.CONNECT,data:e})})):this.packet({type:Ot.CONNECT,data:this.auth})}},{key:"onerror",value:function(t){this.connected||this.emitReserved("connect_error",t)}},{key:"onclose",value:function(t,e){this.connected=!1,delete this.id,this.emitReserved("disconnect",t,e)}},{key:"onpacket",value:function(t){if(t.nsp===this.nsp)switch(t.type){case Ot.CONNECT:if(t.data&&t.data.sid){var e=t.data.sid;this.onconnect(e)}else this.emitReserved("connect_error",new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));break;case Ot.EVENT:case Ot.BINARY_EVENT:this.onevent(t);break;case Ot.ACK:case Ot.BINARY_ACK:this.onack(t);break;case Ot.DISCONNECT:this.ondisconnect();break;case Ot.CONNECT_ERROR:this.destroy();var n=new Error(t.data.message);n.data=t.data.data,this.emitReserved("connect_error",n)}}},{key:"onevent",value:function(t){var e=t.data||[];null!=t.id&&e.push(this.ack(t.id)),this.connected?this.emitEvent(e):this.receiveBuffer.push(Object.freeze(e))}},{key:"emitEvent",value:function(t){if(this._anyListeners&&this._anyListeners.length){var e,n=g(this._anyListeners.slice());try{for(n.s();!(e=n.n()).done;){e.value.apply(this,t)}}catch(t){n.e(t)}finally{n.f()}}y(s(i.prototype),"emit",this).apply(this,t)}},{key:"ack",value:function(t){var e=this,n=!1;return function(){if(!n){n=!0;for(var r=arguments.length,i=new Array(r),o=0;o<r;o++)i[o]=arguments[o];e.packet({type:Ot.ACK,id:t,data:i})}}}},{key:"onack",value:function(t){var e=this.acks[t.id];"function"==typeof e&&(e.apply(this,t.data),delete this.acks[t.id])}},{key:"onconnect",value:function(t){this.id=t,this.connected=!0,this.emitBuffered(),this.emitReserved("connect")}},{key:"emitBuffered",value:function(){var t=this;this.receiveBuffer.forEach((function(e){return t.emitEvent(e)})),this.receiveBuffer=[],this.sendBuffer.forEach((function(e){t.notifyOutgoingListeners(e),t.packet(e)})),this.sendBuffer=[]}},{key:"ondisconnect",value:function(){this.destroy(),this.onclose("io server disconnect")}},{key:"destroy",value:function(){this.subs&&(this.subs.forEach((function(t){return t()})),this.subs=void 0),this.io._destroy(this)}},{key:"disconnect",value:function(){return this.connected&&this.packet({type:Ot.DISCONNECT}),this.destroy(),this.connected&&this.onclose("io client disconnect"),this}},{key:"close",value:function(){return this.disconnect()}},{key:"compress",value:function(t){return this.flags.compress=t,this}},{key:"volatile",get:function(){return this.flags.volatile=!0,this}},{key:"timeout",value:function(t){return this.flags.timeout=t,this}},{key:"onAny",value:function(t){return this._anyListeners=this._anyListeners||[],this._anyListeners.push(t),this}},{key:"prependAny",value:function(t){return this._anyListeners=this._anyListeners||[],this._anyListeners.unshift(t),this}},{key:"offAny",value:function(t){if(!this._anyListeners)return this;if(t){for(var e=this._anyListeners,n=0;n<e.length;n++)if(t===e[n])return e.splice(n,1),this}else this._anyListeners=[];return this}},{key:"listenersAny",value:function(){return this._anyListeners||[]}},{key:"onAnyOutgoing",value:function(t){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.push(t),this}},{key:"prependAnyOutgoing",value:function(t){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.unshift(t),this}},{key:"offAnyOutgoing",value:function(t){if(!this._anyOutgoingListeners)return this;if(t){for(var e=this._anyOutgoingListeners,n=0;n<e.length;n++)if(t===e[n])return e.splice(n,1),this}else this._anyOutgoingListeners=[];return this}},{key:"listenersAnyOutgoing",value:function(){return this._anyOutgoingListeners||[]}},{key:"notifyOutgoingListeners",value:function(t){if(this._anyOutgoingListeners&&this._anyOutgoingListeners.length){var e,n=g(this._anyOutgoingListeners.slice());try{for(n.s();!(e=n.n()).done;){e.value.apply(this,t.data)}}catch(t){n.e(t)}finally{n.f()}}}}]),i}(L);function Nt(t){t=t||{},this.ms=t.min||100,this.max=t.max||1e4,this.factor=t.factor||2,this.jitter=t.jitter>0&&t.jitter<=1?t.jitter:0,this.attempts=0}Nt.prototype.duration=function(){var t=this.ms*Math.pow(this.factor,this.attempts++);if(this.jitter){var e=Math.random(),n=Math.floor(e*this.jitter*t);t=0==(1&Math.floor(10*e))?t-n:t+n}return 0|Math.min(t,this.max)},Nt.prototype.reset=function(){this.attempts=0},Nt.prototype.setMin=function(t){this.ms=t},Nt.prototype.setMax=function(t){this.max=t},Nt.prototype.setJitter=function(t){this.jitter=t};var xt=function(n){o(s,n);var i=p(s);function s(n,r){var o,a;e(this,s),(o=i.call(this)).nsps={},o.subs=[],n&&"object"===t(n)&&(r=n,n=void 0),(r=r||{}).path=r.path||"/socket.io",o.opts=r,D(f(o),r),o.reconnection(!1!==r.reconnection),o.reconnectionAttempts(r.reconnectionAttempts||1/0),o.reconnectionDelay(r.reconnectionDelay||1e3),o.reconnectionDelayMax(r.reconnectionDelayMax||5e3),o.randomizationFactor(null!==(a=r.randomizationFactor)&&void 0!==a?a:.5),o.backoff=new Nt({min:o.reconnectionDelay(),max:o.reconnectionDelayMax(),jitter:o.randomizationFactor()}),o.timeout(null==r.timeout?2e4:r.timeout),o._readyState="closed",o.uri=n;var c=r.parser||Tt;return o.encoder=new c.Encoder,o.decoder=new c.Decoder,o._autoConnect=!1!==r.autoConnect,o._autoConnect&&o.open(),o}return r(s,[{key:"reconnection",value:function(t){return arguments.length?(this._reconnection=!!t,this):this._reconnection}},{key:"reconnectionAttempts",value:function(t){return void 0===t?this._reconnectionAttempts:(this._reconnectionAttempts=t,this)}},{key:"reconnectionDelay",value:function(t){var e;return void 0===t?this._reconnectionDelay:(this._reconnectionDelay=t,null===(e=this.backoff)||void 0===e||e.setMin(t),this)}},{key:"randomizationFactor",value:function(t){var e;return void 0===t?this._randomizationFactor:(this._randomizationFactor=t,null===(e=this.backoff)||void 0===e||e.setJitter(t),this)}},{key:"reconnectionDelayMax",value:function(t){var e;return void 0===t?this._reconnectionDelayMax:(this._reconnectionDelayMax=t,null===(e=this.backoff)||void 0===e||e.setMax(t),this)}},{key:"timeout",value:function(t){return arguments.length?(this._timeout=t,this):this._timeout}},{key:"maybeReconnectOnOpen",value:function(){!this._reconnecting&&this._reconnection&&0===this.backoff.attempts&&this.reconnect()}},{key:"open",value:function(t){var e=this;if(~this._readyState.indexOf("open"))return this;this.engine=new lt(this.uri,this.opts);var n=this.engine,r=this;this._readyState="opening",this.skipReconnect=!1;var i=Ct(n,"open",(function(){r.onopen(),t&&t()})),o=Ct(n,"error",(function(n){r.cleanup(),r._readyState="closed",e.emitReserved("error",n),t?t(n):r.maybeReconnectOnOpen()}));if(!1!==this._timeout){var s=this._timeout;0===s&&i();var a=this.setTimeoutFn((function(){i(),n.close(),n.emit("error",new Error("timeout"))}),s);this.opts.autoUnref&&a.unref(),this.subs.push((function(){clearTimeout(a)}))}return this.subs.push(i),this.subs.push(o),this}},{key:"connect",value:function(t){return this.open(t)}},{key:"onopen",value:function(){this.cleanup(),this._readyState="open",this.emitReserved("open");var t=this.engine;this.subs.push(Ct(t,"ping",this.onping.bind(this)),Ct(t,"data",this.ondata.bind(this)),Ct(t,"error",this.onerror.bind(this)),Ct(t,"close",this.onclose.bind(this)),Ct(this.decoder,"decoded",this.ondecoded.bind(this)))}},{key:"onping",value:function(){this.emitReserved("ping")}},{key:"ondata",value:function(t){try{this.decoder.add(t)}catch(t){this.onclose("parse error",t)}}},{key:"ondecoded",value:function(t){var e=this;it((function(){e.emitReserved("packet",t)}),this.setTimeoutFn)}},{key:"onerror",value:function(t){this.emitReserved("error",t)}},{key:"socket",value:function(t,e){var n=this.nsps[t];return n||(n=new St(this,t,e),this.nsps[t]=n),n}},{key:"_destroy",value:function(t){for(var e=0,n=Object.keys(this.nsps);e<n.length;e++){var r=n[e];if(this.nsps[r].active)return}this._close()}},{key:"_packet",value:function(t){for(var e=this.encoder.encode(t),n=0;n<e.length;n++)this.engine.write(e[n],t.options)}},{key:"cleanup",value:function(){this.subs.forEach((function(t){return t()})),this.subs.length=0,this.decoder.destroy()}},{key:"_close",value:function(){this.skipReconnect=!0,this._reconnecting=!1,this.onclose("forced close"),this.engine&&this.engine.close()}},{key:"disconnect",value:function(){return this._close()}},{key:"onclose",value:function(t,e){this.cleanup(),this.backoff.reset(),this._readyState="closed",this.emitReserved("close",t,e),this._reconnection&&!this.skipReconnect&&this.reconnect()}},{key:"reconnect",value:function(){var t=this;if(this._reconnecting||this.skipReconnect)return this;var e=this;if(this.backoff.attempts>=this._reconnectionAttempts)this.backoff.reset(),this.emitReserved("reconnect_failed"),this._reconnecting=!1;else{var n=this.backoff.duration();this._reconnecting=!0;var r=this.setTimeoutFn((function(){e.skipReconnect||(t.emitReserved("reconnect_attempt",e.backoff.attempts),e.skipReconnect||e.open((function(n){n?(e._reconnecting=!1,e.reconnect(),t.emitReserved("reconnect_error",n)):e.onreconnect()})))}),n);this.opts.autoUnref&&r.unref(),this.subs.push((function(){clearTimeout(r)}))}}},{key:"onreconnect",value:function(){var t=this.backoff.attempts;this._reconnecting=!1,this.backoff.reset(),this.emitReserved("reconnect",t)}}]),s}(L),Lt={};function Pt(e,n){"object"===t(e)&&(n=e,e=void 0);var r,i=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",n=arguments.length>2?arguments[2]:void 0,r=t;n=n||"undefined"!=typeof location&&location,null==t&&(t=n.protocol+"//"+n.host),"string"==typeof t&&("/"===t.charAt(0)&&(t="/"===t.charAt(1)?n.protocol+t:n.host+t),/^(https?|wss?):\/\//.test(t)||(t=void 0!==n?n.protocol+"//"+t:"https://"+t),r=ft(t)),r.port||(/^(http|ws)$/.test(r.protocol)?r.port="80":/^(http|ws)s$/.test(r.protocol)&&(r.port="443")),r.path=r.path||"/";var i=-1!==r.host.indexOf(":")?"["+r.host+"]":r.host;return r.id=r.protocol+"://"+i+":"+r.port+e,r.href=r.protocol+"://"+i+(n&&n.port===r.port?"":":"+r.port),r}(e,(n=n||{}).path||"/socket.io"),o=i.source,s=i.id,a=i.path,c=Lt[s]&&a in Lt[s].nsps;return n.forceNew||n["force new connection"]||!1===n.multiplex||c?r=new xt(o,n):(Lt[s]||(Lt[s]=new xt(o,n)),r=Lt[s]),i.query&&!n.query&&(n.query=i.queryKey),r.socket(i.path,n)}return i(Pt,{Manager:xt,Socket:St,io:Pt,connect:Pt}),Pt}));


},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AceBaseBase = exports.AceBaseBaseSettings = void 0;
/**
   ________________________________________________________________________________

      ___          ______
     / _ \         | ___ \
    / /_\ \ ___ ___| |_/ / __ _ ___  ___
    |  _  |/ __/ _ \ ___ \/ _` / __|/ _ \
    | | | | (_|  __/ |_/ / (_| \__ \  __/
    \_| |_/\___\___\____/ \__,_|___/\___|
                        realtime database

   Copyright 2018-2022 by Ewout Stortenbeker (me@appy.one)
   Published under MIT license

   See docs at https://github.com/appy-one/acebase
   ________________________________________________________________________________

*/
const simple_event_emitter_1 = require("./simple-event-emitter");
const data_reference_1 = require("./data-reference");
const type_mappings_1 = require("./type-mappings");
const optional_observable_1 = require("./optional-observable");
const debug_1 = require("./debug");
const simple_colors_1 = require("./simple-colors");
class AceBaseBaseSettings {
    constructor(options) {
        if (typeof options !== 'object') {
            options = {};
        }
        this.logLevel = options.logLevel || 'log';
        this.logColors = typeof options.logColors === 'boolean' ? options.logColors : true;
        this.info = typeof options.info === 'string' ? options.info : undefined;
        this.sponsor = typeof options.sponsor === 'boolean' ? options.sponsor : false;
    }
}
exports.AceBaseBaseSettings = AceBaseBaseSettings;
class AceBaseBase extends simple_event_emitter_1.SimpleEventEmitter {
    /**
     * @param dbname Name of the database to open or create
     */
    constructor(dbname, options) {
        super();
        this._ready = false;
        options = new AceBaseBaseSettings(options || {});
        this.name = dbname;
        // Setup console logging
        this.debug = new debug_1.DebugLogger(options.logLevel, `[${dbname}]`);
        // Enable/disable logging with colors
        (0, simple_colors_1.SetColorsEnabled)(options.logColors);
        // ASCI art: http://patorjk.com/software/taag/#p=display&f=Doom&t=AceBase
        const logoStyle = [simple_colors_1.ColorStyle.magenta, simple_colors_1.ColorStyle.bold];
        const logo = '     ___          ______                ' + '\n' +
            '    / _ \\         | ___ \\               ' + '\n' +
            '   / /_\\ \\ ___ ___| |_/ / __ _ ___  ___ ' + '\n' +
            '   |  _  |/ __/ _ \\ ___ \\/ _` / __|/ _ \\' + '\n' +
            '   | | | | (_|  __/ |_/ / (_| \\__ \\  __/' + '\n' +
            '   \\_| |_/\\___\\___\\____/ \\__,_|___/\\___|';
        const info = (options.info ? ''.padStart(40 - options.info.length, ' ') + options.info + '\n' : '');
        if (!options.sponsor) {
            // if you are a sponsor, you can switch off the "AceBase banner ad"
            this.debug.write(logo.colorize(logoStyle));
            info && this.debug.write(info.colorize(simple_colors_1.ColorStyle.magenta));
        }
        // Setup type mapping functionality
        this.types = new type_mappings_1.TypeMappings(this);
        this.once('ready', () => {
            // console.log(`database "${dbname}" (${this.constructor.name}) is ready to use`);
            this._ready = true;
        });
    }
    /**
     * Waits for the database to be ready before running your callback.
     * @param callback (optional) callback function that is called when the database is ready to be used. You can also use the returned promise.
     * @returns returns a promise that resolves when ready
     */
    async ready(callback) {
        if (!this._ready) {
            // Wait for ready event
            await new Promise(resolve => this.on('ready', resolve));
        }
        callback === null || callback === void 0 ? void 0 : callback();
    }
    get isReady() {
        return this._ready;
    }
    /**
     * Allow specific observable implementation to be used
     * @param ObservableImpl Implementation to use
     */
    setObservable(ObservableImpl) {
        (0, optional_observable_1.setObservable)(ObservableImpl);
    }
    /**
     * Creates a reference to a node
     * @param path
     * @returns reference to the requested node
     */
    ref(path) {
        return new data_reference_1.DataReference(this, path);
    }
    /**
     * Get a reference to the root database node
     * @returns reference to root node
     */
    get root() {
        return this.ref('');
    }
    /**
     * Creates a query on the requested node
     * @param path
     * @returns query for the requested node
     */
    query(path) {
        const ref = new data_reference_1.DataReference(this, path);
        return new data_reference_1.DataReferenceQuery(ref);
    }
    get indexes() {
        return {
            /**
             * Gets all indexes
             */
            get: () => {
                return this.api.getIndexes();
            },
            /**
             * Creates an index on "key" for all child nodes at "path". If the index already exists, nothing happens.
             * Example: creating an index on all "name" keys of child objects of path "system/users",
             * will index "system/users/user1/name", "system/users/user2/name" etc.
             * You can also use wildcard paths to enable indexing and quering of fragmented data.
             * Example: path "users/*\/posts", key "title": will index all "title" keys in all posts of all users.
             * @param path path to the container node
             * @param key name of the key to index every container child node
             * @param options any additional options
             */
            create: (path, key, options) => {
                return this.api.createIndex(path, key, options);
            },
            /**
             * Deletes an existing index from the database
             */
            delete: async (filePath) => {
                return this.api.deleteIndex(filePath);
            },
        };
    }
    get schema() {
        return {
            get: (path) => {
                return this.api.getSchema(path);
            },
            set: (path, schema) => {
                return this.api.setSchema(path, schema);
            },
            all: () => {
                return this.api.getSchemas();
            },
            check: (path, value, isUpdate) => {
                return this.api.validateSchema(path, value, isUpdate);
            },
        };
    }
}
exports.AceBaseBase = AceBaseBase;

},{"./data-reference":26,"./debug":28,"./optional-observable":32,"./simple-colors":39,"./simple-event-emitter":40,"./type-mappings":43}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Api = void 0;
class NotImplementedError extends Error {
    constructor(name) { super(`${name} is not implemented`); }
}
/**
 * Refactor to type/interface once acebase and acebase-client have been ported to TS
 */
class Api {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    /**
     * Provides statistics
     * @param options
     */
    stats(options) { throw new NotImplementedError('stats'); }
    /**
     * @param path
     * @param event event to subscribe to ("value", "child_added" etc)
     * @param callback callback function
     */
    subscribe(path, event, callback, settings) { throw new NotImplementedError('subscribe'); }
    unsubscribe(path, event, callback) { throw new NotImplementedError('unsubscribe'); }
    update(path, updates, options) { throw new NotImplementedError('update'); }
    set(path, value, options) { throw new NotImplementedError('set'); }
    get(path, options) { throw new NotImplementedError('get'); }
    transaction(path, callback, options) { throw new NotImplementedError('transaction'); }
    exists(path) { throw new NotImplementedError('exists'); }
    query(path, query, options) { throw new NotImplementedError('query'); }
    reflect(path, type, args) { throw new NotImplementedError('reflect'); }
    export(path, write, options) { throw new NotImplementedError('export'); }
    import(path, read, options) { throw new NotImplementedError('import'); }
    /** Creates an index on key for all child nodes at path */
    createIndex(path, key, options) { throw new NotImplementedError('createIndex'); }
    getIndexes() { throw new NotImplementedError('getIndexes'); }
    deleteIndex(filePath) { throw new NotImplementedError('deleteIndex'); }
    setSchema(path, schema) { throw new NotImplementedError('setSchema'); }
    getSchema(path) { throw new NotImplementedError('getSchema'); }
    getSchemas() { throw new NotImplementedError('getSchemas'); }
    validateSchema(path, value, isUpdate) { throw new NotImplementedError('validateSchema'); }
    getMutations(filter) { throw new NotImplementedError('getMutations'); }
    getChanges(filter) { throw new NotImplementedError('getChanges'); }
}
exports.Api = Api;

},{}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ascii85 = void 0;
function c(input, length, result) {
    const b = [0, 0, 0, 0, 0];
    for (let i = 0; i < length; i += 4) {
        let n = ((input[i] * 256 + input[i + 1]) * 256 + input[i + 2]) * 256 + input[i + 3];
        if (!n) {
            result.push('z');
        }
        else {
            for (let j = 0; j < 5; b[j++] = n % 85 + 33, n = Math.floor(n / 85))
                ;
            result.push(String.fromCharCode(b[4], b[3], b[2], b[1], b[0]));
        }
    }
}
function encode(arr) {
    // summary: encodes input data in ascii85 string
    // input: ArrayLike
    const input = arr, result = [], remainder = input.length % 4, length = input.length - remainder;
    c(input, length, result);
    if (remainder) {
        const t = new Uint8Array(4);
        t.set(input.slice(length), 0);
        c(t, 4, result);
        let x = result.pop();
        if (x == 'z') {
            x = '!!!!!';
        }
        result.push(x.substr(0, remainder + 1));
    }
    let ret = result.join(''); // String
    ret = '<~' + ret + '~>';
    return ret;
}
exports.ascii85 = {
    encode: function (arr) {
        if (arr instanceof ArrayBuffer) {
            arr = new Uint8Array(arr, 0, arr.byteLength);
        }
        return encode(arr);
    },
    decode: function (input) {
        // summary: decodes the input string back to an ArrayBuffer
        // input: String: the input string to decode
        if (!input.startsWith('<~') || !input.endsWith('~>')) {
            throw new Error('Invalid input string');
        }
        input = input.substr(2, input.length - 4);
        const n = input.length, r = [], b = [0, 0, 0, 0, 0];
        let t, x, y, d;
        for (let i = 0; i < n; ++i) {
            if (input.charAt(i) == 'z') {
                r.push(0, 0, 0, 0);
                continue;
            }
            for (let j = 0; j < 5; ++j) {
                b[j] = input.charCodeAt(i + j) - 33;
            }
            d = n - i;
            if (d < 5) {
                for (let j = d; j < 4; b[++j] = 0)
                    ;
                b[d] = 85;
            }
            t = (((b[0] * 85 + b[1]) * 85 + b[2]) * 85 + b[3]) * 85 + b[4];
            x = t & 255;
            t >>>= 8;
            y = t & 255;
            t >>>= 8;
            r.push(t >>> 8, t & 255, y, x);
            for (let j = d; j < 5; ++j, r.pop())
                ;
            i += 4;
        }
        const data = new Uint8Array(r);
        return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    },
};

},{}],22:[function(require,module,exports){
"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const pad_1 = require("../pad");
const env = typeof window === 'object' ? window : self, globalCount = Object.keys(env).length, mimeTypesLength = (_b = (_a = navigator.mimeTypes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0, clientId = (0, pad_1.default)((mimeTypesLength
    + navigator.userAgent.length).toString(36)
    + globalCount.toString(36), 4);
function fingerprint() {
    return clientId;
}
exports.default = fingerprint;

},{"../pad":24}],23:[function(require,module,exports){
"use strict";
/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 *
 * time biasing added by Ewout Stortenbeker for AceBase
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fingerprint_1 = require("./fingerprint");
const pad_1 = require("./pad");
let c = 0;
const blockSize = 4, base = 36, discreteValues = Math.pow(base, blockSize);
function randomBlock() {
    return (0, pad_1.default)((Math.random() * discreteValues << 0).toString(base), blockSize);
}
function safeCounter() {
    c = c < discreteValues ? c : 0;
    c++; // this is not subliminal
    return c - 1;
}
function cuid(timebias = 0) {
    // Starting with a lowercase letter makes
    // it HTML element ID friendly.
    const letter = 'c', // hard-coded allows for sequential access
    // timestamp
    // warning: this exposes the exact date and time
    // that the uid was created.
    // NOTES Ewout:
    // - added timebias
    // - at '2059/05/25 19:38:27.456', timestamp will become 1 character larger!
    timestamp = (new Date().getTime() + timebias).toString(base), 
    // Prevent same-machine collisions.
    counter = (0, pad_1.default)(safeCounter().toString(base), blockSize), 
    // A few chars to generate distinct ids for different
    // clients (so different computers are far less
    // likely to generate the same id)
    print = (0, fingerprint_1.default)(), 
    // Grab some more chars from Math.random()
    random = randomBlock() + randomBlock();
    return letter + timestamp + counter + print + random;
}
exports.default = cuid;
// Not using slugs, removed code

},{"./fingerprint":22,"./pad":24}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function pad(num, size) {
    const s = '000000000' + num;
    return s.substr(s.length - size);
}
exports.default = pad;

},{}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderedCollectionProxy = exports.proxyAccess = exports.LiveDataProxy = void 0;
const utils_1 = require("./utils");
const data_reference_1 = require("./data-reference");
const data_snapshot_1 = require("./data-snapshot");
const path_reference_1 = require("./path-reference");
const id_1 = require("./id");
const optional_observable_1 = require("./optional-observable");
const process_1 = require("./process");
const path_info_1 = require("./path-info");
const simple_event_emitter_1 = require("./simple-event-emitter");
class RelativeNodeTarget extends Array {
    static areEqual(t1, t2) {
        return t1.length === t2.length && t1.every((key, i) => t2[i] === key);
    }
    static isAncestor(ancestor, other) {
        return ancestor.length < other.length && ancestor.every((key, i) => other[i] === key);
    }
    static isDescendant(descendant, other) {
        return descendant.length > other.length && other.every((key, i) => descendant[i] === key);
    }
}
const isProxy = Symbol('isProxy');
class LiveDataProxy {
    /**
     * Creates a live data proxy for the given reference. The data of the reference's path will be loaded, and kept in-sync
     * with live data by listening for 'mutations' events. Any changes made to the value by the client will be synced back
     * to the database.
     * @param ref DataReference to create proxy for.
     * @param options proxy initialization options
     * be written to the database.
     */
    static async create(ref, options) {
        var _a;
        ref = new data_reference_1.DataReference(ref.db, ref.path); // Use copy to prevent context pollution on original reference
        let cache, loaded = false;
        let latestCursor = options === null || options === void 0 ? void 0 : options.cursor;
        let proxy;
        const proxyId = id_1.ID.generate(); //ref.push().key;
        // let onMutationCallback: ProxyObserveMutationsCallback;
        // let onErrorCallback: ProxyObserveErrorCallback = err => {
        //     console.error(err.message, err.details);
        // };
        const clientSubscriptions = [];
        const clientEventEmitter = new simple_event_emitter_1.SimpleEventEmitter();
        clientEventEmitter.on('cursor', (cursor) => latestCursor = cursor);
        clientEventEmitter.on('error', (err) => {
            console.error(err.message, err.details);
        });
        const applyChange = (keys, newValue) => {
            // Make changes to cache
            if (keys.length === 0) {
                cache = newValue;
                return true;
            }
            const allowCreation = false; //cache === null; // If the proxy'd target did not exist upon load, we must allow it to be created now.
            if (allowCreation) {
                cache = typeof keys[0] === 'number' ? [] : {};
            }
            let target = cache;
            const trailKeys = keys.slice();
            while (trailKeys.length > 1) {
                const key = trailKeys.shift();
                if (!(key in target)) {
                    if (allowCreation) {
                        target[key] = typeof key === 'number' ? [] : {};
                    }
                    else {
                        // Have we missed an event, or are local pending mutations creating this conflict?
                        return false; // Do not proceed
                    }
                }
                target = target[key];
            }
            const prop = trailKeys.shift();
            if (newValue === null) {
                // Remove it
                target instanceof Array ? target.splice(prop, 1) : delete target[prop];
            }
            else {
                // Set or update it
                target[prop] = newValue;
            }
            return true;
        };
        // Subscribe to mutations events on the target path
        const syncFallback = async () => {
            if (!loaded) {
                return;
            }
            await reload();
        };
        const subscription = ref.on('mutations', { syncFallback }).subscribe(async (snap) => {
            var _a;
            if (!loaded) {
                return;
            }
            const context = snap.context();
            const isRemote = ((_a = context.acebase_proxy) === null || _a === void 0 ? void 0 : _a.id) !== proxyId;
            if (!isRemote) {
                return; // Update was done through this proxy, no need to update cache or trigger local value subscriptions
            }
            const mutations = snap.val(false);
            const proceed = mutations.every(mutation => {
                if (!applyChange(mutation.target, mutation.val)) {
                    return false;
                }
                // if (onMutationCallback) {
                const changeRef = mutation.target.reduce((ref, key) => ref.child(key), ref);
                const changeSnap = new data_snapshot_1.DataSnapshot(changeRef, mutation.val, false, mutation.prev, snap.context());
                // onMutationCallback(changeSnap, isRemote); // onMutationCallback uses try/catch for client callback
                clientEventEmitter.emit('mutation', { snapshot: changeSnap, isRemote });
                // }
                return true;
            });
            if (proceed) {
                clientEventEmitter.emit('cursor', context.acebase_cursor); // // NOTE: cursor is only present in mutations done remotely. For our own updates, server cursors are returned by ref.set and ref.update
                localMutationsEmitter.emit('mutations', { origin: 'remote', snap });
            }
            else {
                console.warn(`Cached value of live data proxy on "${ref.path}" appears outdated, will be reloaded`);
                await reload();
            }
        });
        // Setup updating functionality: enqueue all updates, process them at next tick in the order they were issued
        let processPromise = Promise.resolve();
        const mutationQueue = [];
        const transactions = [];
        const pushLocalMutations = async () => {
            // Sync all local mutations that are not in a transaction
            const mutations = [];
            for (let i = 0, m = mutationQueue[0]; i < mutationQueue.length; i++, m = mutationQueue[i]) {
                if (!transactions.find(t => RelativeNodeTarget.areEqual(t.target, m.target) || RelativeNodeTarget.isAncestor(t.target, m.target))) {
                    mutationQueue.splice(i, 1);
                    i--;
                    mutations.push(m);
                }
            }
            if (mutations.length === 0) {
                return;
            }
            // Add current (new) values to mutations
            mutations.forEach(mutation => {
                mutation.value = (0, utils_1.cloneObject)(getTargetValue(cache, mutation.target));
            });
            // Run local onMutation & onChange callbacks in the next tick
            process_1.default.nextTick(() => {
                // Run onMutation callback for each changed node
                const context = { acebase_proxy: { id: proxyId, source: 'update' } };
                // if (onMutationCallback) {
                mutations.forEach(mutation => {
                    const mutationRef = mutation.target.reduce((ref, key) => ref.child(key), ref);
                    const mutationSnap = new data_snapshot_1.DataSnapshot(mutationRef, mutation.value, false, mutation.previous, context);
                    // onMutationCallback(mutationSnap, false);
                    clientEventEmitter.emit('mutation', { snapshot: mutationSnap, isRemote: false });
                });
                // }
                // Notify local subscribers
                const snap = new data_snapshot_1.MutationsDataSnapshot(ref, mutations.map(m => ({ target: m.target, val: m.value, prev: m.previous })), context);
                localMutationsEmitter.emit('mutations', { origin: 'local', snap });
            });
            // Update database async
            // const batchId = ID.generate();
            processPromise = mutations
                .reduce((mutations, m, i, arr) => {
                // Only keep top path mutations to prevent unneccessary child path updates
                if (!arr.some(other => RelativeNodeTarget.isAncestor(other.target, m.target))) {
                    mutations.push(m);
                }
                return mutations;
            }, [])
                .reduce((updates, m) => {
                // Prepare db updates
                const target = m.target;
                if (target.length === 0) {
                    // Overwrite this proxy's root value
                    updates.push({ ref, target, value: cache, type: 'set', previous: m.previous });
                }
                else {
                    const parentTarget = target.slice(0, -1);
                    const key = target.slice(-1)[0];
                    const parentRef = parentTarget.reduce((ref, key) => ref.child(key), ref);
                    const parentUpdate = updates.find(update => update.ref.path === parentRef.path);
                    const cacheValue = getTargetValue(cache, target); // m.value?
                    const prevValue = m.previous;
                    if (parentUpdate) {
                        parentUpdate.value[key] = cacheValue;
                        parentUpdate.previous[key] = prevValue;
                    }
                    else {
                        updates.push({ ref: parentRef, target: parentTarget, value: { [key]: cacheValue }, type: 'update', previous: { [key]: prevValue } });
                    }
                }
                return updates;
            }, [])
                .reduce(async (promise, update /*, i, updates */) => {
                // Execute db update
                // i === 0 && console.log(`Proxy: processing ${updates.length} db updates to paths:`, updates.map(update => update.ref.path));
                const context = {
                    acebase_proxy: {
                        id: proxyId,
                        source: update.type,
                        // update_id: ID.generate(),
                        // batch_id: batchId,
                        // batch_updates: updates.length
                    },
                };
                await promise;
                await update.ref
                    .context(context)[update.type](update.value) // .set or .update
                    .catch(err => {
                    clientEventEmitter.emit('error', { source: 'update', message: `Error processing update of "/${ref.path}"`, details: err });
                    // console.warn(`Proxy could not update DB, should rollback (${update.type}) the proxy value of "${update.ref.path}" to: `, update.previous);
                    const context = { acebase_proxy: { id: proxyId, source: 'update-rollback' } };
                    const mutations = [];
                    if (update.type === 'set') {
                        setTargetValue(cache, update.target, update.previous);
                        const mutationSnap = new data_snapshot_1.DataSnapshot(update.ref, update.previous, false, update.value, context);
                        clientEventEmitter.emit('mutation', { snapshot: mutationSnap, isRemote: false });
                        mutations.push({ target: update.target, val: update.previous, prev: update.value });
                    }
                    else {
                        // update
                        Object.keys(update.previous).forEach(key => {
                            setTargetValue(cache, update.target.concat(key), update.previous[key]);
                            const mutationSnap = new data_snapshot_1.DataSnapshot(update.ref.child(key), update.previous[key], false, update.value[key], context);
                            clientEventEmitter.emit('mutation', { snapshot: mutationSnap, isRemote: false });
                            mutations.push({ target: update.target.concat(key), val: update.previous[key], prev: update.value[key] });
                        });
                    }
                    // Run onMutation callback for each node being rolled back
                    mutations.forEach(m => {
                        const mutationRef = m.target.reduce((ref, key) => ref.child(key), ref);
                        const mutationSnap = new data_snapshot_1.DataSnapshot(mutationRef, m.val, false, m.prev, context);
                        clientEventEmitter.emit('mutation', { snapshot: mutationSnap, isRemote: false });
                    });
                    // Notify local subscribers:
                    const snap = new data_snapshot_1.MutationsDataSnapshot(update.ref, mutations, context);
                    localMutationsEmitter.emit('mutations', { origin: 'local', snap });
                });
                if (update.ref.cursor) {
                    // Should also be available in context.acebase_cursor now
                    clientEventEmitter.emit('cursor', update.ref.cursor);
                }
            }, processPromise);
            await processPromise;
        };
        let syncInProgress = false;
        const syncPromises = [];
        const syncCompleted = () => {
            let resolve;
            const promise = new Promise(rs => resolve = rs);
            syncPromises.push({ resolve });
            return promise;
        };
        let processQueueTimeout = null;
        const scheduleSync = () => {
            if (!processQueueTimeout) {
                processQueueTimeout = setTimeout(async () => {
                    syncInProgress = true;
                    processQueueTimeout = null;
                    await pushLocalMutations();
                    syncInProgress = false;
                    syncPromises.splice(0).forEach(p => p.resolve());
                }, 0);
            }
        };
        const flagOverwritten = (target) => {
            if (!mutationQueue.find(m => RelativeNodeTarget.areEqual(m.target, target))) {
                mutationQueue.push({ target, previous: (0, utils_1.cloneObject)(getTargetValue(cache, target)) });
            }
            // schedule database updates
            scheduleSync();
        };
        const localMutationsEmitter = new simple_event_emitter_1.SimpleEventEmitter();
        const addOnChangeHandler = (target, callback) => {
            const isObject = val => val !== null && typeof val === 'object';
            const mutationsHandler = async (details) => {
                var _a;
                const { snap, origin } = details;
                const context = snap.context();
                const causedByOurProxy = ((_a = context.acebase_proxy) === null || _a === void 0 ? void 0 : _a.id) === proxyId;
                if (details.origin === 'remote' && causedByOurProxy) {
                    // Any local changes already triggered subscription callbacks
                    console.error('DEV ISSUE: mutationsHandler was called from remote event originating from our own proxy');
                    return;
                }
                const mutations = snap.val(false).filter(mutation => {
                    // Keep mutations impacting the subscribed target: mutations on target, or descendant or ancestor of target
                    return mutation.target.slice(0, target.length).every((key, i) => target[i] === key);
                });
                if (mutations.length === 0) {
                    return;
                }
                let newValue, previousValue;
                // If there is a mutation on the target itself, or parent/ancestor path, there can only be one. We can take a shortcut
                const singleMutation = mutations.find(m => m.target.length <= target.length);
                if (singleMutation) {
                    const trailKeys = target.slice(singleMutation.target.length);
                    newValue = trailKeys.reduce((val, key) => !isObject(val) || !(key in val) ? null : val[key], singleMutation.val);
                    previousValue = trailKeys.reduce((val, key) => !isObject(val) || !(key in val) ? null : val[key], singleMutation.prev);
                }
                else {
                    // All mutations are on children/descendants of our target
                    // Construct new & previous values by combining cache and snapshot
                    const currentValue = getTargetValue(cache, target);
                    newValue = (0, utils_1.cloneObject)(currentValue);
                    previousValue = (0, utils_1.cloneObject)(newValue);
                    mutations.forEach(mutation => {
                        // mutation.target is relative to proxy root
                        const trailKeys = mutation.target.slice(target.length);
                        for (let i = 0, val = newValue, prev = previousValue; i < trailKeys.length; i++) { // arr = PathInfo.getPathKeys(mutationPath).slice(PathInfo.getPathKeys(targetRef.path).length)
                            const last = i + 1 === trailKeys.length, key = trailKeys[i];
                            if (last) {
                                val[key] = mutation.val;
                                if (val[key] === null) {
                                    delete val[key];
                                }
                                prev[key] = mutation.prev;
                                if (prev[key] === null) {
                                    delete prev[key];
                                }
                            }
                            else {
                                val = val[key] = key in val ? val[key] : {};
                                prev = prev[key] = key in prev ? prev[key] : {};
                            }
                        }
                    });
                }
                process_1.default.nextTick(() => {
                    // Run callback with read-only (frozen) values in next tick
                    let keepSubscription = true;
                    try {
                        keepSubscription = false !== callback(Object.freeze(newValue), Object.freeze(previousValue), !causedByOurProxy, context);
                    }
                    catch (err) {
                        clientEventEmitter.emit('error', { source: origin === 'remote' ? 'remote_update' : 'local_update', message: 'Error running subscription callback', details: err });
                    }
                    if (keepSubscription === false) {
                        stop();
                    }
                });
            };
            localMutationsEmitter.on('mutations', mutationsHandler);
            const stop = () => {
                localMutationsEmitter.off('mutations').off('mutations', mutationsHandler);
                clientSubscriptions.splice(clientSubscriptions.findIndex(cs => cs.stop === stop), 1);
            };
            clientSubscriptions.push({ target, stop });
            return { stop };
        };
        const handleFlag = (flag, target, args) => {
            if (flag === 'write') {
                return flagOverwritten(target);
            }
            else if (flag === 'onChange') {
                return addOnChangeHandler(target, args.callback);
            }
            else if (flag === 'subscribe' || flag === 'observe') {
                const subscribe = subscriber => {
                    const currentValue = getTargetValue(cache, target);
                    subscriber.next(currentValue);
                    const subscription = addOnChangeHandler(target, (value /*, previous, isRemote, context */) => {
                        subscriber.next(value);
                    });
                    return function unsubscribe() {
                        subscription.stop();
                    };
                };
                if (flag === 'subscribe') {
                    return subscribe;
                }
                // Try to load Observable
                const Observable = (0, optional_observable_1.getObservable)();
                return new Observable(subscribe);
            }
            else if (flag === 'transaction') {
                const hasConflictingTransaction = transactions.some(t => RelativeNodeTarget.areEqual(target, t.target) || RelativeNodeTarget.isAncestor(target, t.target) || RelativeNodeTarget.isDescendant(target, t.target));
                if (hasConflictingTransaction) {
                    // TODO: Wait for this transaction to finish, then try again
                    return Promise.reject(new Error('Cannot start transaction because it conflicts with another transaction'));
                }
                return new Promise(async (resolve) => {
                    // If there are pending mutations on target (or deeper), wait until they have been synchronized
                    const hasPendingMutations = mutationQueue.some(m => RelativeNodeTarget.areEqual(target, m.target) || RelativeNodeTarget.isAncestor(target, m.target));
                    if (hasPendingMutations) {
                        if (!syncInProgress) {
                            scheduleSync();
                        }
                        await syncCompleted();
                    }
                    const tx = { target, status: 'started', transaction: null };
                    transactions.push(tx);
                    tx.transaction = {
                        get status() { return tx.status; },
                        get completed() { return tx.status !== 'started'; },
                        get mutations() {
                            return mutationQueue.filter(m => RelativeNodeTarget.areEqual(tx.target, m.target) || RelativeNodeTarget.isAncestor(tx.target, m.target));
                        },
                        get hasMutations() {
                            return this.mutations.length > 0;
                        },
                        async commit() {
                            if (this.completed) {
                                throw new Error(`Transaction has completed already (status '${tx.status}')`);
                            }
                            tx.status = 'finished';
                            transactions.splice(transactions.indexOf(tx), 1);
                            if (syncInProgress) {
                                // Currently syncing without our mutations
                                await syncCompleted();
                            }
                            scheduleSync();
                            await syncCompleted();
                        },
                        rollback() {
                            // Remove mutations from queue
                            if (this.completed) {
                                throw new Error(`Transaction has completed already (status '${tx.status}')`);
                            }
                            tx.status = 'canceled';
                            const mutations = [];
                            for (let i = 0; i < mutationQueue.length; i++) {
                                const m = mutationQueue[i];
                                if (RelativeNodeTarget.areEqual(tx.target, m.target) || RelativeNodeTarget.isAncestor(tx.target, m.target)) {
                                    mutationQueue.splice(i, 1);
                                    i--;
                                    mutations.push(m);
                                }
                            }
                            // Replay mutations in reverse order
                            mutations.reverse()
                                .forEach(m => {
                                if (m.target.length === 0) {
                                    cache = m.previous;
                                }
                                else {
                                    setTargetValue(cache, m.target, m.previous);
                                }
                            });
                            // Remove transaction
                            transactions.splice(transactions.indexOf(tx), 1);
                        },
                    };
                    resolve(tx.transaction);
                });
            }
        };
        const snap = await ref.get({ cache_mode: 'allow', cache_cursor: options === null || options === void 0 ? void 0 : options.cursor });
        // const gotOfflineStartValue = snap.context().acebase_origin === 'cache';
        // if (gotOfflineStartValue) {
        //     console.warn(`Started data proxy with cached value of "${ref.path}", check if its value is reloaded on next connection!`);
        // }
        if (snap.context().acebase_origin !== 'cache') {
            clientEventEmitter.emit('cursor', (_a = ref.cursor) !== null && _a !== void 0 ? _a : null); // latestCursor = snap.context().acebase_cursor ?? null;
        }
        loaded = true;
        cache = snap.val();
        if (cache === null && typeof (options === null || options === void 0 ? void 0 : options.defaultValue) !== 'undefined') {
            cache = options.defaultValue;
            const context = {
                acebase_proxy: {
                    id: proxyId,
                    source: 'default',
                    // update_id: ID.generate()
                },
            };
            await ref.context(context).set(cache);
        }
        proxy = createProxy({ root: { ref, get cache() { return cache; } }, target: [], id: proxyId, flag: handleFlag });
        const assertProxyAvailable = () => {
            if (proxy === null) {
                throw new Error('Proxy was destroyed');
            }
        };
        const reload = async () => {
            // Manually reloads current value when cache is out of sync, which should only
            // be able to happen if an AceBaseClient is used without cache database,
            // and the connection to the server was lost for a while. In all other cases,
            // there should be no need to call this method.
            assertProxyAvailable();
            mutationQueue.splice(0); // Remove pending mutations. Will be empty in production, but might not be while debugging, leading to weird behaviour.
            const snap = await ref.get({ allow_cache: false });
            const oldVal = cache, newVal = snap.val();
            cache = newVal;
            // Compare old and new values
            const mutations = (0, utils_1.getMutations)(oldVal, newVal);
            if (mutations.length === 0) {
                return; // Nothing changed
            }
            // Run onMutation callback for each changed node
            const context = snap.context(); // context might contain acebase_cursor if server support that
            context.acebase_proxy = { id: proxyId, source: 'reload' };
            // if (onMutationCallback) {
            mutations.forEach(m => {
                const targetRef = getTargetRef(ref, m.target);
                const newSnap = new data_snapshot_1.DataSnapshot(targetRef, m.val, m.val === null, m.prev, context);
                clientEventEmitter.emit('mutation', { snapshot: newSnap, isRemote: true });
            });
            // }
            // Notify local subscribers
            const mutationsSnap = new data_snapshot_1.MutationsDataSnapshot(ref, mutations, context);
            localMutationsEmitter.emit('mutations', { origin: 'local', snap: mutationsSnap });
        };
        return {
            async destroy() {
                await processPromise;
                const promises = [
                    subscription.stop(),
                    ...clientSubscriptions.map(cs => cs.stop()),
                ];
                await Promise.all(promises);
                ['cursor', 'mutation', 'error'].forEach(event => clientEventEmitter.off(event));
                cache = null; // Remove cache
                proxy = null;
            },
            stop() {
                this.destroy();
            },
            get value() {
                assertProxyAvailable();
                return proxy;
            },
            get hasValue() {
                assertProxyAvailable();
                return cache !== null;
            },
            set value(val) {
                // Overwrite the value of the proxied path itself!
                assertProxyAvailable();
                if (val !== null && typeof val === 'object' && val[isProxy]) {
                    // Assigning one proxied value to another
                    val = val.valueOf();
                }
                flagOverwritten([]);
                cache = val;
            },
            get ref() {
                return ref;
            },
            get cursor() {
                return latestCursor;
            },
            reload,
            onMutation(callback) {
                // Fires callback each time anything changes
                assertProxyAvailable();
                clientEventEmitter.off('mutation'); // Mimic legacy behaviour that overwrites handler
                clientEventEmitter.on('mutation', ({ snapshot, isRemote }) => {
                    try {
                        callback(snapshot, isRemote);
                    }
                    catch (err) {
                        clientEventEmitter.emit('error', { source: 'mutation_callback', message: 'Error in dataproxy onMutation callback', details: err });
                    }
                });
            },
            onError(callback) {
                // Fires callback each time anything goes wrong
                assertProxyAvailable();
                clientEventEmitter.off('error'); // Mimic legacy behaviour that overwrites handler
                clientEventEmitter.on('error', (err) => {
                    try {
                        callback(err);
                    }
                    catch (err) {
                        console.error(`Error in dataproxy onError callback: ${err.message}`);
                    }
                });
            },
            on(event, callback) {
                clientEventEmitter.on(event, callback);
            },
            off(event, callback) {
                clientEventEmitter.off(event, callback);
            },
        };
    }
}
exports.LiveDataProxy = LiveDataProxy;
function getTargetValue(obj, target) {
    let val = obj;
    for (const key of target) {
        val = typeof val === 'object' && val !== null && key in val ? val[key] : null;
    }
    return val;
}
function setTargetValue(obj, target, value) {
    if (target.length === 0) {
        throw new Error('Cannot update root target, caller must do that itself!');
    }
    const targetObject = target.slice(0, -1).reduce((obj, key) => obj[key], obj);
    const prop = target.slice(-1)[0];
    if (value === null || typeof value === 'undefined') {
        // Remove it
        targetObject instanceof Array ? targetObject.splice(prop, 1) : delete targetObject[prop];
    }
    else {
        // Set or update it
        targetObject[prop] = value;
    }
}
function getTargetRef(ref, target) {
    // Create new DataReference to prevent context reuse
    const path = path_info_1.PathInfo.get(ref.path).childPath(target);
    return new data_reference_1.DataReference(ref.db, path);
}
function createProxy(context) {
    const targetRef = getTargetRef(context.root.ref, context.target);
    const childProxies = [];
    const handler = {
        get(target, prop, receiver) {
            target = getTargetValue(context.root.cache, context.target);
            if (typeof prop === 'symbol') {
                if (prop.toString() === Symbol.iterator.toString()) {
                    // Use .values for @@iterator symbol
                    prop = 'values';
                }
                else if (prop.toString() === isProxy.toString()) {
                    return true;
                }
                else {
                    return Reflect.get(target, prop, receiver);
                }
            }
            if (prop === 'valueOf') {
                return function valueOf() { return target; };
            }
            if (target === null || typeof target !== 'object') {
                throw new Error(`Cannot read property "${prop}" of ${target}. Value of path "/${targetRef.path}" is not an object (anymore)`);
            }
            if (target instanceof Array && typeof prop === 'string' && /^[0-9]+$/.test(prop)) {
                // Proxy type definitions say prop can be a number, but this is never the case.
                prop = parseInt(prop);
            }
            const value = target[prop];
            if (value === null) {
                // Removed property. Should never happen, but if it does:
                delete target[prop];
                return; // undefined
            }
            // Check if we have a child proxy for this property already.
            // If so, and the properties' typeof value did not change, return that
            const childProxy = childProxies.find(proxy => proxy.prop === prop);
            if (childProxy) {
                if (childProxy.typeof === typeof value) {
                    return childProxy.value;
                }
                childProxies.splice(childProxies.indexOf(childProxy), 1);
            }
            const proxifyChildValue = (prop) => {
                const value = target[prop]; //
                const childProxy = childProxies.find(child => child.prop === prop);
                if (childProxy) {
                    if (childProxy.typeof === typeof value) {
                        return childProxy.value;
                    }
                    childProxies.splice(childProxies.indexOf(childProxy), 1);
                }
                if (typeof value !== 'object') {
                    // Can't proxify non-object values
                    return value;
                }
                const newChildProxy = createProxy({ root: context.root, target: context.target.concat(prop), id: context.id, flag: context.flag });
                childProxies.push({ typeof: typeof value, prop, value: newChildProxy });
                return newChildProxy;
            };
            const unproxyValue = (value) => {
                return value !== null && typeof value === 'object' && value[isProxy]
                    ? value.getTarget()
                    : value;
            };
            // If the property contains a simple value, return it.
            if (['string', 'number', 'boolean'].includes(typeof value)
                || value instanceof Date
                || value instanceof path_reference_1.PathReference
                || value instanceof ArrayBuffer
                || (typeof value === 'object' && 'buffer' in value) // Typed Arrays
            ) {
                return value;
            }
            const isArray = target instanceof Array;
            if (prop === 'toString') {
                return function toString() {
                    return `[LiveDataProxy for "${targetRef.path}"]`;
                };
            }
            if (typeof value === 'undefined') {
                if (prop === 'push') {
                    // Push item to an object collection
                    return function push(item) {
                        const childRef = targetRef.push();
                        context.flag('write', context.target.concat(childRef.key)); //, { previous: null }
                        target[childRef.key] = item;
                        return childRef.key;
                    };
                }
                if (prop === 'getTarget') {
                    // Get unproxied readonly (but still live) version of data.
                    return function (warn = true) {
                        warn && console.warn('Use getTarget with caution - any changes will not be synchronized!');
                        return target;
                    };
                }
                if (prop === 'getRef') {
                    // Gets the DataReference to this data target
                    return function getRef() {
                        const ref = getTargetRef(context.root.ref, context.target);
                        return ref;
                    };
                }
                if (prop === 'forEach') {
                    return function forEach(callback) {
                        const keys = Object.keys(target);
                        // Fix: callback with unproxied value
                        let stop = false;
                        for (let i = 0; !stop && i < keys.length; i++) {
                            const key = keys[i];
                            const value = proxifyChildValue(key); //, target[key]
                            stop = callback(value, key, i) === false;
                        }
                    };
                }
                if (['values', 'entries', 'keys'].includes(prop)) {
                    return function* generator() {
                        const keys = Object.keys(target);
                        for (const key of keys) {
                            if (prop === 'keys') {
                                yield key;
                            }
                            else {
                                const value = proxifyChildValue(key); //, target[key]
                                if (prop === 'entries') {
                                    yield [key, value];
                                }
                                else {
                                    yield value;
                                }
                            }
                        }
                    };
                }
                if (prop === 'toArray') {
                    return function toArray(sortFn) {
                        const arr = Object.keys(target).map(key => proxifyChildValue(key)); //, target[key]
                        if (sortFn) {
                            arr.sort(sortFn);
                        }
                        return arr;
                    };
                }
                if (prop === 'onChanged') {
                    // Starts monitoring the value
                    return function onChanged(callback) {
                        return context.flag('onChange', context.target, { callback });
                    };
                }
                if (prop === 'subscribe') {
                    // Gets subscriber function to use with Observables, or custom handling
                    return function subscribe() {
                        return context.flag('subscribe', context.target);
                    };
                }
                if (prop === 'getObservable') {
                    // Creates an observable for monitoring the value
                    return function getObservable() {
                        return context.flag('observe', context.target);
                    };
                }
                if (prop === 'getOrderedCollection') {
                    return function getOrderedCollection(orderProperty, orderIncrement) {
                        return new OrderedCollectionProxy(this, orderProperty, orderIncrement);
                    };
                }
                if (prop === 'startTransaction') {
                    return function startTransaction() {
                        return context.flag('transaction', context.target);
                    };
                }
                if (prop === 'remove' && !isArray) {
                    // Removes target from object collection
                    return function remove() {
                        if (context.target.length === 0) {
                            throw new Error('Can\'t remove proxy root value');
                        }
                        const parent = getTargetValue(context.root.cache, context.target.slice(0, -1));
                        const key = context.target.slice(-1)[0];
                        context.flag('write', context.target);
                        delete parent[key];
                    };
                }
                return; // undefined
            }
            else if (typeof value === 'function') {
                if (isArray) {
                    // Handle array methods
                    const writeArray = (action) => {
                        context.flag('write', context.target);
                        return action();
                    };
                    const cleanArrayValues = values => values.map(value => {
                        value = unproxyValue(value);
                        removeVoidProperties(value);
                        return value;
                    });
                    // Methods that directly change the array:
                    if (prop === 'push') {
                        return function push(...items) {
                            items = cleanArrayValues(items);
                            return writeArray(() => target.push(...items)); // push the items to the cache array
                        };
                    }
                    if (prop === 'pop') {
                        return function pop() {
                            return writeArray(() => target.pop());
                        };
                    }
                    if (prop === 'splice') {
                        return function splice(start, deleteCount, ...items) {
                            items = cleanArrayValues(items);
                            return writeArray(() => target.splice(start, deleteCount, ...items));
                        };
                    }
                    if (prop === 'shift') {
                        return function shift() {
                            return writeArray(() => target.shift());
                        };
                    }
                    if (prop === 'unshift') {
                        return function unshift(...items) {
                            items = cleanArrayValues(items);
                            return writeArray(() => target.unshift(...items));
                        };
                    }
                    if (prop === 'sort') {
                        return function sort(compareFn) {
                            return writeArray(() => target.sort(compareFn));
                        };
                    }
                    if (prop === 'reverse') {
                        return function reverse() {
                            return writeArray(() => target.reverse());
                        };
                    }
                    // Methods that do not change the array themselves, but
                    // have callbacks that might, or return child values:
                    if (['indexOf', 'lastIndexOf'].includes(prop)) {
                        return function indexOf(item, start) {
                            if (item !== null && typeof item === 'object' && item[isProxy]) {
                                // Use unproxied value, or array.indexOf will return -1 (fixes issue #1)
                                item = item.getTarget(false);
                            }
                            return target[prop](item, start);
                        };
                    }
                    if (['forEach', 'every', 'some', 'filter', 'map'].includes(prop)) {
                        return function iterate(callback) {
                            return target[prop]((value, i) => {
                                return callback(proxifyChildValue(i), i, proxy); //, value
                            });
                        };
                    }
                    if (['reduce', 'reduceRight'].includes(prop)) {
                        return function reduce(callback, initialValue) {
                            return target[prop]((prev, value, i) => {
                                return callback(prev, proxifyChildValue(i), i, proxy); //, value
                            }, initialValue);
                        };
                    }
                    if (['find', 'findIndex'].includes(prop)) {
                        return function find(callback) {
                            let value = target[prop]((value, i) => {
                                return callback(proxifyChildValue(i), i, proxy); // , value
                            });
                            if (prop === 'find' && value) {
                                const index = target.indexOf(value);
                                value = proxifyChildValue(index); //, value
                            }
                            return value;
                        };
                    }
                    if (['values', 'entries', 'keys'].includes(prop)) {
                        return function* generator() {
                            for (let i = 0; i < target.length; i++) {
                                if (prop === 'keys') {
                                    yield i;
                                }
                                else {
                                    const value = proxifyChildValue(i); //, target[i]
                                    if (prop === 'entries') {
                                        yield [i, value];
                                    }
                                    else {
                                        yield value;
                                    }
                                }
                            }
                        };
                    }
                }
                // Other function (or not an array), should not alter its value
                // return function fn(...args) {
                //     return target[prop](...args);
                // }
                return value;
            }
            // Proxify any other value
            return proxifyChildValue(prop); //, value
        },
        set(target, prop, value, receiver) {
            // Eg: chats.chat1.title = 'New chat title';
            // target === chats.chat1, prop === 'title'
            target = getTargetValue(context.root.cache, context.target);
            if (typeof prop === 'symbol') {
                return Reflect.set(target, prop, value, receiver);
            }
            if (target === null || typeof target !== 'object') {
                throw new Error(`Cannot set property "${prop}" of ${target}. Value of path "/${targetRef.path}" is not an object`);
            }
            if (target instanceof Array && typeof prop === 'string') {
                if (!/^[0-9]+$/.test(prop)) {
                    throw new Error(`Cannot set property "${prop}" on array value of path "/${targetRef.path}"`);
                }
                prop = parseInt(prop);
            }
            if (value !== null) {
                if (typeof value === 'object') {
                    if (value[isProxy]) {
                        // Assigning one proxied value to another
                        value = value.valueOf();
                    }
                    // else if (Object.isFrozen(value)) {
                    //     // Create a copy to unfreeze it
                    //     value = cloneObject(value);
                    // }
                    value = (0, utils_1.cloneObject)(value); // Fix #10, always clone objects so changes made through the proxy won't change the original object (and vice versa)
                }
                if ((0, utils_1.valuesAreEqual)(value, target[prop])) { //if (compareValues(value, target[prop]) === 'identical') { // (typeof value !== 'object' && target[prop] === value) {
                    // not changing the actual value, ignore
                    return true;
                }
            }
            if (context.target.some(key => typeof key === 'number')) {
                // Updating an object property inside an array. Flag the first array in target to be written.
                // Eg: when chat.members === [{ name: 'Ewout', id: 'someid' }]
                // --> chat.members[0].name = 'Ewout' --> Rewrite members array instead of chat/members[0]/name
                context.flag('write', context.target.slice(0, context.target.findIndex(key => typeof key === 'number')));
            }
            else if (target instanceof Array) {
                // Flag the entire array to be overwritten
                context.flag('write', context.target);
            }
            else {
                // Flag child property
                context.flag('write', context.target.concat(prop));
            }
            // Set cached value:
            if (value === null) {
                delete target[prop];
            }
            else {
                removeVoidProperties(value);
                target[prop] = value;
            }
            return true;
        },
        deleteProperty(target, prop) {
            target = getTargetValue(context.root.cache, context.target);
            if (target === null) {
                throw new Error(`Cannot delete property ${prop.toString()} of null`);
            }
            if (typeof prop === 'symbol') {
                return Reflect.deleteProperty(target, prop);
            }
            if (!(prop in target)) {
                return true; // Nothing to delete
            }
            context.flag('write', context.target.concat(prop));
            delete target[prop];
            return true;
        },
        ownKeys(target) {
            target = getTargetValue(context.root.cache, context.target);
            return Reflect.ownKeys(target);
        },
        has(target, prop) {
            target = getTargetValue(context.root.cache, context.target);
            return Reflect.has(target, prop);
        },
        getOwnPropertyDescriptor(target, prop) {
            target = getTargetValue(context.root.cache, context.target);
            const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
            if (descriptor) {
                descriptor.configurable = true; // prevent "TypeError: 'getOwnPropertyDescriptor' on proxy: trap reported non-configurability for property '...' which is either non-existant or configurable in the proxy target"
            }
            return descriptor;
        },
        getPrototypeOf(target) {
            target = getTargetValue(context.root.cache, context.target);
            return Reflect.getPrototypeOf(target);
        },
    };
    const proxy = new Proxy({}, handler);
    return proxy;
}
function removeVoidProperties(obj) {
    if (typeof obj !== 'object') {
        return;
    }
    Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (val === null || typeof val === 'undefined') {
            delete obj[key];
        }
        else if (typeof val === 'object') {
            removeVoidProperties(val);
        }
    });
}
/**
 * Convenience function to access ILiveDataProxyValue methods on a proxied value
 * @param proxiedValue The proxied value to get access to
 * @returns Returns the same object typecasted to an ILiveDataProxyValue
 * @example
 * // IChatMessages is an ObjectCollection<IChatMessage>
 * let observable: Observable<IChatMessages>;
 *
 * // Allows you to do this:
 * observable = proxyAccess<IChatMessages>(chat.messages).getObservable();
 *
 * // Instead of:
 * observable = (chat.messages.msg1 as any as ILiveDataProxyValue<IChatMessages>).getObservable();
 *
 * // Both do the exact same, but the first is less obscure
 */
function proxyAccess(proxiedValue) {
    if (typeof proxiedValue !== 'object' || !proxiedValue[isProxy]) {
        throw new Error('Given value is not proxied. Make sure you are referencing the value through the live data proxy.');
    }
    return proxiedValue;
}
exports.proxyAccess = proxyAccess;
/**
 * Provides functionality to work with ordered collections through a live data proxy. Eliminates
 * the need for arrays to handle ordered data by adding a 'sort' properties to child objects in a
 * collection, and provides functionality to sort and reorder items with a minimal amount of database
 * updates.
 */
class OrderedCollectionProxy {
    constructor(collection, orderProperty = 'order', orderIncrement = 10) {
        this.collection = collection;
        this.orderProperty = orderProperty;
        this.orderIncrement = orderIncrement;
        if (typeof collection !== 'object' || !collection[isProxy]) {
            throw new Error('Collection is not proxied');
        }
        if (collection.valueOf() instanceof Array) {
            throw new Error('Collection is an array, not an object collection');
        }
        if (!Object.keys(collection).every(key => typeof collection[key] === 'object')) {
            throw new Error('Collection has non-object children');
        }
        // Check if the collection has order properties. If not, assign them now
        const ok = Object.keys(collection).every(key => typeof collection[key][orderProperty] === 'number');
        if (!ok) {
            // Assign order properties now. Database will be updated automatically
            const keys = Object.keys(collection);
            for (let i = 0; i < keys.length; i++) {
                const item = collection[keys[i]];
                item[orderProperty] = i * orderIncrement; // 0, 10, 20, 30 etc
            }
        }
    }
    /**
     * Gets an observable for the target object collection. Same as calling `collection.getObservable()`
     * @returns
     */
    getObservable() {
        return proxyAccess(this.collection).getObservable();
    }
    /**
     * Gets an observable that emits a new ordered array representation of the object collection each time
     * the unlaying data is changed. Same as calling `getArray()` in a `getObservable().subscribe` callback
     * @returns
     */
    getArrayObservable() {
        const Observable = (0, optional_observable_1.getObservable)();
        return new Observable(subscriber => {
            const subscription = this.getObservable().subscribe(( /*value*/) => {
                const newArray = this.getArray();
                subscriber.next(newArray);
            });
            return function unsubscribe() {
                subscription.unsubscribe();
            };
        });
    }
    /**
     * Gets an ordered array representation of the items in your object collection. The items in the array
     * are proxied values, changes will be in sync with the database. Note that the array itself
     * is not mutable: adding or removing items to it will NOT update the collection in the
     * the database and vice versa. Use `add`, `delete`, `sort` and `move` methods to make changes
     * that impact the collection's sorting order
     * @returns order array
     */
    getArray() {
        const arr = proxyAccess(this.collection).toArray((a, b) => a[this.orderProperty] - b[this.orderProperty]);
        // arr.push = (...items: T[]) => {
        //     items.forEach(item => this.add(item));
        //     return arr.length;
        // };
        return arr;
    }
    add(item, index, from) {
        const arr = this.getArray();
        let minOrder = Number.POSITIVE_INFINITY, maxOrder = Number.NEGATIVE_INFINITY;
        for (let i = 0; i < arr.length; i++) {
            const order = arr[i][this.orderProperty];
            minOrder = Math.min(order, minOrder);
            maxOrder = Math.max(order, maxOrder);
        }
        let fromKey;
        if (typeof from === 'number') {
            // Moving existing item
            fromKey = Object.keys(this.collection).find(key => this.collection[key] === item);
            if (!fromKey) {
                throw new Error('item not found in collection');
            }
            if (from === index) {
                return { key: fromKey, index };
            }
            if (Math.abs(from - index) === 1) {
                // Position being swapped, swap their order property values
                const otherItem = arr[index];
                const otherOrder = otherItem[this.orderProperty];
                otherItem[this.orderProperty] = item[this.orderProperty];
                item[this.orderProperty] = otherOrder;
                return { key: fromKey, index };
            }
            else {
                // Remove from array, code below will add again
                arr.splice(from, 1);
            }
        }
        if (typeof index !== 'number' || index >= arr.length) {
            // append at the end
            index = arr.length;
            item[this.orderProperty] = arr.length == 0 ? 0 : maxOrder + this.orderIncrement;
        }
        else if (index === 0) {
            // insert before all others
            item[this.orderProperty] = arr.length == 0 ? 0 : minOrder - this.orderIncrement;
        }
        else {
            // insert between 2 others
            const orders = arr.map(item => item[this.orderProperty]);
            const gap = orders[index] - orders[index - 1];
            if (gap > 1) {
                item[this.orderProperty] = orders[index] - Math.floor(gap / 2);
            }
            else {
                // TODO: Can this gap be enlarged by moving one of both orders?
                // For now, change all other orders
                arr.splice(index, 0, item);
                for (let i = 0; i < arr.length; i++) {
                    arr[i][this.orderProperty] = i * this.orderIncrement;
                }
            }
        }
        const key = typeof fromKey === 'string'
            ? fromKey // Moved item, don't add it
            : proxyAccess(this.collection).push(item);
        return { key, index };
    }
    /**
     * Deletes an item from the object collection using the their index in the sorted array representation
     * @param index
     * @returns the key of the collection's child that was deleted
     */
    delete(index) {
        const arr = this.getArray();
        const item = arr[index];
        if (!item) {
            throw new Error(`Item at index ${index} not found`);
        }
        const key = Object.keys(this.collection).find(key => this.collection[key] === item);
        if (!key) {
            throw new Error('Cannot find target object to delete');
        }
        this.collection[key] = null; // Deletes it from db
        return { key, index };
    }
    /**
     * Moves an item in the object collection by reordering it
     * @param fromIndex Current index in the array (the ordered representation of the object collection)
     * @param toIndex Target index in the array
     * @returns
     */
    move(fromIndex, toIndex) {
        const arr = this.getArray();
        return this.add(arr[fromIndex], toIndex, fromIndex);
    }
    /**
     * Reorders the object collection using given sort function. Allows quick reordering of the collection which is persisted in the database
     * @param sortFn
     */
    sort(sortFn) {
        const arr = this.getArray();
        arr.sort(sortFn);
        for (let i = 0; i < arr.length; i++) {
            arr[i][this.orderProperty] = i * this.orderIncrement;
        }
    }
}
exports.OrderedCollectionProxy = OrderedCollectionProxy;

},{"./data-reference":26,"./data-snapshot":27,"./id":29,"./optional-observable":32,"./path-info":34,"./path-reference":35,"./process":36,"./simple-event-emitter":40,"./utils":44}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataReferencesArray = exports.DataSnapshotsArray = exports.DataReferenceQuery = exports.DataReference = exports.QueryDataRetrievalOptions = exports.DataRetrievalOptions = void 0;
const data_snapshot_1 = require("./data-snapshot");
const subscription_1 = require("./subscription");
const id_1 = require("./id");
const path_info_1 = require("./path-info");
const data_proxy_1 = require("./data-proxy");
const optional_observable_1 = require("./optional-observable");
class DataRetrievalOptions {
    /**
     * Options for data retrieval, allows selective loading of object properties
     */
    constructor(options) {
        if (!options) {
            options = {};
        }
        if (typeof options.include !== 'undefined' && !(options.include instanceof Array)) {
            throw new TypeError('options.include must be an array');
        }
        if (typeof options.exclude !== 'undefined' && !(options.exclude instanceof Array)) {
            throw new TypeError('options.exclude must be an array');
        }
        if (typeof options.child_objects !== 'undefined' && typeof options.child_objects !== 'boolean') {
            throw new TypeError('options.child_objects must be a boolean');
        }
        if (typeof options.cache_mode === 'string' && !['allow', 'bypass', 'force'].includes(options.cache_mode)) {
            throw new TypeError('invalid value for options.cache_mode');
        }
        this.include = options.include || undefined;
        this.exclude = options.exclude || undefined;
        this.child_objects = typeof options.child_objects === 'boolean' ? options.child_objects : undefined;
        this.cache_mode = typeof options.cache_mode === 'string'
            ? options.cache_mode
            : typeof options.allow_cache === 'boolean'
                ? options.allow_cache ? 'allow' : 'bypass'
                : 'allow';
        this.cache_cursor = typeof options.cache_cursor === 'string' ? options.cache_cursor : undefined;
    }
}
exports.DataRetrievalOptions = DataRetrievalOptions;
class QueryDataRetrievalOptions extends DataRetrievalOptions {
    /**
     * @param options Options for data retrieval, allows selective loading of object properties
     */
    constructor(options) {
        super(options);
        if (!['undefined', 'boolean'].includes(typeof options.snapshots)) {
            throw new TypeError('options.snapshots must be a boolean');
        }
        this.snapshots = typeof options.snapshots === 'boolean' ? options.snapshots : true;
    }
}
exports.QueryDataRetrievalOptions = QueryDataRetrievalOptions;
const _private = Symbol('private');
class DataReference {
    /**
     * Creates a reference to a node
     */
    constructor(db, path, vars) {
        this.db = db;
        if (!path) {
            path = '';
        }
        path = path.replace(/^\/|\/$/g, ''); // Trim slashes
        const pathInfo = path_info_1.PathInfo.get(path);
        const key = pathInfo.key;
        const callbacks = [];
        this[_private] = {
            get path() { return path; },
            get key() { return key; },
            get callbacks() { return callbacks; },
            vars: vars || {},
            context: {},
            pushed: false,
            cursor: null,
        };
    }
    context(context, merge = false) {
        const currentContext = this[_private].context;
        if (typeof context === 'object') {
            const newContext = context ? merge ? currentContext || {} : context : {};
            if (context) {
                // Merge new with current context
                Object.keys(context).forEach(key => {
                    newContext[key] = context[key];
                });
            }
            this[_private].context = newContext;
            return this;
        }
        else if (typeof context === 'undefined') {
            console.warn('Use snap.context() instead of snap.ref.context() to get updating context in event callbacks');
            return currentContext;
        }
        else {
            throw new Error('Invalid context argument');
        }
    }
    /**
     * Contains the last received cursor for this referenced path (if the connected database has transaction logging enabled).
     * If you want to be notified if this value changes, add a handler with `ref.onCursor(callback)`
     */
    get cursor() {
        return this[_private].cursor;
    }
    set cursor(value) {
        var _a;
        this[_private].cursor = value;
        (_a = this.onCursor) === null || _a === void 0 ? void 0 : _a.call(this, value);
    }
    /**
    * The path this instance was created with
    */
    get path() { return this[_private].path; }
    /**
     * The key or index of this node
     */
    get key() { return this[_private].key; }
    /**
     * Returns a new reference to this node's parent
     */
    get parent() {
        const currentPath = path_info_1.PathInfo.fillVariables2(this.path, this.vars);
        const info = path_info_1.PathInfo.get(currentPath);
        if (info.parentPath === null) {
            return null;
        }
        return new DataReference(this.db, info.parentPath).context(this[_private].context);
    }
    /**
     * Contains values of the variables/wildcards used in a subscription path if this reference was
     * created by an event ("value", "child_added" etc), or in a type mapping path when serializing / instantiating typed objects
     */
    get vars() {
        return this[_private].vars;
    }
    /**
     * Returns a new reference to a child node
     * @param childPath Child key, index or path
     * @returns reference to the child
     */
    child(childPath) {
        childPath = typeof childPath === 'number' ? childPath : childPath.replace(/^\/|\/$/g, '');
        const currentPath = path_info_1.PathInfo.fillVariables2(this.path, this.vars);
        const targetPath = path_info_1.PathInfo.getChildPath(currentPath, childPath);
        return new DataReference(this.db, targetPath).context(this[_private].context); //  `${this.path}/${childPath}`
    }
    /**
     * Sets or overwrites the stored value
     * @param value value to store in database
     * @param onComplete optional completion callback to use instead of returning promise
     * @returns promise that resolves with this reference when completed
     */
    async set(value, onComplete) {
        try {
            if (this.isWildcardPath) {
                throw new Error(`Cannot set the value of wildcard path "/${this.path}"`);
            }
            if (this.parent === null) {
                throw new Error('Cannot set the root object. Use update, or set individual child properties');
            }
            if (typeof value === 'undefined') {
                throw new TypeError(`Cannot store undefined value in "/${this.path}"`);
            }
            if (!this.db.isReady) {
                await this.db.ready();
            }
            value = this.db.types.serialize(this.path, value);
            const { cursor } = await this.db.api.set(this.path, value, { context: this[_private].context });
            this.cursor = cursor;
            if (typeof onComplete === 'function') {
                try {
                    onComplete(null, this);
                }
                catch (err) {
                    console.error('Error in onComplete callback:', err);
                }
            }
        }
        catch (err) {
            if (typeof onComplete === 'function') {
                try {
                    onComplete(err, this);
                }
                catch (err) {
                    console.error('Error in onComplete callback:', err);
                }
            }
            else {
                // throw again
                throw err;
            }
        }
        return this;
    }
    /**
     * Updates properties of the referenced node
     * @param updates object containing the properties to update
     * @param onComplete optional completion callback to use instead of returning promise
     * @return returns promise that resolves with this reference once completed
     */
    async update(updates, onComplete) {
        try {
            if (this.isWildcardPath) {
                throw new Error(`Cannot update the value of wildcard path "/${this.path}"`);
            }
            if (!this.db.isReady) {
                await this.db.ready();
            }
            if (typeof updates !== 'object' || updates instanceof Array || updates instanceof ArrayBuffer || updates instanceof Date) {
                await this.set(updates);
            }
            else if (Object.keys(updates).length === 0) {
                console.warn(`update called on path "/${this.path}", but there is nothing to update`);
            }
            else {
                updates = this.db.types.serialize(this.path, updates);
                const { cursor } = await this.db.api.update(this.path, updates, { context: this[_private].context });
                this.cursor = cursor;
            }
            if (typeof onComplete === 'function') {
                try {
                    onComplete(null, this);
                }
                catch (err) {
                    console.error('Error in onComplete callback:', err);
                }
            }
        }
        catch (err) {
            if (typeof onComplete === 'function') {
                try {
                    onComplete(err, this);
                }
                catch (err) {
                    console.error('Error in onComplete callback:', err);
                }
            }
            else {
                // throw again
                throw err;
            }
        }
        return this;
    }
    /**
     * Sets the value a node using a transaction: it runs your callback function with the current value, uses its return value as the new value to store.
     * The transaction is canceled if your callback returns undefined, or throws an error. If your callback returns null, the target node will be removed.
     * @param callback - callback function that performs the transaction on the node's current value. It must return the new value to store (or promise with new value), undefined to cancel the transaction, or null to remove the node.
     * @returns returns a promise that resolves with the DataReference once the transaction has been processed
     */
    async transaction(callback) {
        if (this.isWildcardPath) {
            throw new Error(`Cannot start a transaction on wildcard path "/${this.path}"`);
        }
        if (!this.db.isReady) {
            await this.db.ready();
        }
        let throwError;
        const cb = (currentValue) => {
            currentValue = this.db.types.deserialize(this.path, currentValue);
            const snap = new data_snapshot_1.DataSnapshot(this, currentValue);
            let newValue;
            try {
                newValue = callback(snap);
            }
            catch (err) {
                // callback code threw an error
                throwError = err; // Remember error
                return; // cancel transaction by returning undefined
            }
            if (newValue instanceof Promise) {
                return newValue
                    .then((val) => {
                    return this.db.types.serialize(this.path, val);
                })
                    .catch(err => {
                    throwError = err; // Remember error
                    return; // cancel transaction by returning undefined
                });
            }
            else {
                return this.db.types.serialize(this.path, newValue);
            }
        };
        const { cursor } = await this.db.api.transaction(this.path, cb, { context: this[_private].context });
        this.cursor = cursor;
        if (throwError) {
            // Rethrow error from callback code
            throw throwError;
        }
        return this;
    }
    on(event, callback, cancelCallback) {
        if (this.path === '' && ['value', 'child_changed'].includes(event)) {
            // Removed 'notify_value' and 'notify_child_changed' events from the list, they do not require additional data loading anymore.
            console.warn('WARNING: Listening for value and child_changed events on the root node is a bad practice. These events require loading of all data (value event), or potentially lots of data (child_changed event) each time they are fired');
        }
        let eventPublisher = null;
        const eventStream = new subscription_1.EventStream(publisher => { eventPublisher = publisher; });
        // Map OUR callback to original callback, so .off can remove the right callback(s)
        const cb = {
            event,
            stream: eventStream,
            userCallback: typeof callback === 'function' && callback,
            ourCallback: (err, path, newValue, oldValue, eventContext) => {
                if (err) {
                    // TODO: Investigate if this ever happens?
                    this.db.debug.error(`Error getting data for event ${event} on path "${path}"`, err);
                    return;
                }
                const ref = this.db.ref(path);
                ref[_private].vars = path_info_1.PathInfo.extractVariables(this.path, path);
                let callbackObject;
                if (event.startsWith('notify_')) {
                    // No data event, callback with reference
                    callbackObject = ref.context(eventContext || {});
                }
                else {
                    const values = {
                        previous: this.db.types.deserialize(path, oldValue),
                        current: this.db.types.deserialize(path, newValue),
                    };
                    if (event === 'child_removed') {
                        callbackObject = new data_snapshot_1.DataSnapshot(ref, values.previous, true, values.previous, eventContext);
                    }
                    else if (event === 'mutations') {
                        callbackObject = new data_snapshot_1.MutationsDataSnapshot(ref, values.current, eventContext);
                    }
                    else {
                        const isRemoved = event === 'mutated' && values.current === null;
                        callbackObject = new data_snapshot_1.DataSnapshot(ref, values.current, isRemoved, values.previous, eventContext);
                    }
                }
                eventPublisher.publish(callbackObject);
                if (eventContext === null || eventContext === void 0 ? void 0 : eventContext.acebase_cursor) {
                    this.cursor = eventContext.acebase_cursor;
                }
            },
        };
        this[_private].callbacks.push(cb);
        const subscribe = () => {
            // (NEW) Add callback to event stream
            // ref.on('value', callback) is now exactly the same as ref.on('value').subscribe(callback)
            if (typeof callback === 'function') {
                eventStream.subscribe(callback, (activated, cancelReason) => {
                    if (!activated) {
                        cancelCallback && cancelCallback(cancelReason);
                    }
                });
            }
            const advancedOptions = typeof callback === 'object'
                ? callback
                : { newOnly: !callback }; // newOnly: if callback is not 'truthy', could change this to (typeof callback !== 'function' && callback !== true) but that would break client code that uses a truthy argument.
            if (typeof advancedOptions.newOnly !== 'boolean') {
                advancedOptions.newOnly = false;
            }
            if (this.isWildcardPath) {
                advancedOptions.newOnly = true;
            }
            const cancelSubscription = (err) => {
                // Access denied?
                // Cancel subscription
                const callbacks = this[_private].callbacks;
                callbacks.splice(callbacks.indexOf(cb), 1);
                this.db.api.unsubscribe(this.path, event, cb.ourCallback);
                // Call cancelCallbacks
                this.db.debug.error(`Subscription "${event}" on path "/${this.path}" canceled because of an error: ${err.message}`);
                eventPublisher.cancel(err.message);
            };
            const authorized = this.db.api.subscribe(this.path, event, cb.ourCallback, { newOnly: advancedOptions.newOnly, cancelCallback: cancelSubscription, syncFallback: advancedOptions.syncFallback });
            const allSubscriptionsStoppedCallback = () => {
                const callbacks = this[_private].callbacks;
                callbacks.splice(callbacks.indexOf(cb), 1);
                return this.db.api.unsubscribe(this.path, event, cb.ourCallback);
            };
            if (authorized instanceof Promise) {
                // Web API now returns a promise that resolves if the request is allowed
                // and rejects when access is denied by the set security rules
                authorized.then(() => {
                    // Access granted
                    eventPublisher.start(allSubscriptionsStoppedCallback);
                }).catch(cancelSubscription);
            }
            else {
                // Local API, always authorized
                eventPublisher.start(allSubscriptionsStoppedCallback);
            }
            if (!advancedOptions.newOnly) {
                // If callback param is supplied (either a callback function or true or something else truthy),
                // it will fire events for current values right now.
                // Otherwise, it expects the .subscribe methode to be used, which will then
                // only be called for future events
                if (event === 'value') {
                    this.get(snap => {
                        eventPublisher.publish(snap);
                    });
                }
                else if (event === 'child_added') {
                    this.get(snap => {
                        const val = snap.val();
                        if (val === null || typeof val !== 'object') {
                            return;
                        }
                        Object.keys(val).forEach(key => {
                            const childSnap = new data_snapshot_1.DataSnapshot(this.child(key), val[key]);
                            eventPublisher.publish(childSnap);
                        });
                    });
                }
                else if (event === 'notify_child_added') {
                    // Use the reflect API to get current children.
                    // NOTE: This does not work with AceBaseServer <= v0.9.7, only when signed in as admin
                    const step = 100, limit = step;
                    let skip = 0;
                    const more = async () => {
                        const children = await this.db.api.reflect(this.path, 'children', { limit, skip });
                        children.list.forEach(child => {
                            const childRef = this.child(child.key);
                            eventPublisher.publish(childRef);
                            // typeof callback === 'function' && callback(childRef);
                        });
                        if (children.more) {
                            skip += step;
                            more();
                        }
                    };
                    more();
                }
            }
        };
        if (this.db.isReady) {
            subscribe();
        }
        else {
            this.db.ready(subscribe);
        }
        return eventStream;
    }
    off(event, callback) {
        const subscriptions = this[_private].callbacks;
        const stopSubs = subscriptions.filter(sub => (!event || sub.event === event) && (!callback || sub.userCallback === callback));
        if (stopSubs.length === 0) {
            this.db.debug.warn(`Can't find event subscriptions to stop (path: "${this.path}", event: ${event || '(any)'}, callback: ${callback})`);
        }
        stopSubs.forEach(sub => {
            sub.stream.stop();
        });
        return this;
    }
    get(optionsOrCallback, callback) {
        if (!this.db.isReady) {
            const promise = this.db.ready().then(() => this.get(optionsOrCallback, callback));
            return typeof optionsOrCallback !== 'function' && typeof callback !== 'function' ? promise : undefined; // only return promise if no callback is used
        }
        callback =
            typeof optionsOrCallback === 'function'
                ? optionsOrCallback
                : typeof callback === 'function'
                    ? callback
                    : undefined;
        if (this.isWildcardPath) {
            const error = new Error(`Cannot get value of wildcard path "/${this.path}". Use .query() instead`);
            if (typeof callback === 'function') {
                throw error;
            }
            return Promise.reject(error);
        }
        const options = new DataRetrievalOptions(typeof optionsOrCallback === 'object' ? optionsOrCallback : { cache_mode: 'allow' });
        const promise = this.db.api.get(this.path, options).then(result => {
            var _a;
            const isNewApiResult = ('context' in result && 'value' in result);
            if (!isNewApiResult) {
                // acebase-core version package was updated but acebase or acebase-client package was not? Warn, but don't throw an error.
                console.warn('AceBase api.get method returned an old response value. Update your acebase or acebase-client package');
                result = { value: result, context: {} };
            }
            const value = this.db.types.deserialize(this.path, result.value);
            const snapshot = new data_snapshot_1.DataSnapshot(this, value, undefined, undefined, result.context);
            if ((_a = result.context) === null || _a === void 0 ? void 0 : _a.acebase_cursor) {
                this.cursor = result.context.acebase_cursor;
            }
            return snapshot;
        });
        if (callback) {
            promise.then(callback).catch(err => {
                console.error('Uncaught error:', err);
            });
            return;
        }
        else {
            return promise;
        }
    }
    /**
     * Waits for an event to occur
     * @param event Name of the event, eg "value", "child_added", "child_changed", "child_removed"
     * @param options data retrieval options, to include or exclude specific child keys
     * @returns returns promise that resolves with a snapshot of the data
     */
    once(event, options) {
        if (event === 'value' && !this.isWildcardPath) {
            // Shortcut, do not start listening for future events
            return this.get(options);
        }
        return new Promise((resolve) => {
            const callback = (snap) => {
                this.off(event, callback); // unsubscribe directly
                resolve(snap);
            };
            this.on(event, callback);
        });
    }
    /**
     * @param value optional value to store into the database right away
     * @param onComplete optional callback function to run once value has been stored
     * @returns returns promise that resolves with the reference after the passed value has been stored
     */
    push(value, onComplete) {
        if (this.isWildcardPath) {
            const error = new Error(`Cannot push to wildcard path "/${this.path}"`);
            if (typeof value === 'undefined' || typeof onComplete === 'function') {
                throw error;
            }
            return Promise.reject(error);
        }
        const id = id_1.ID.generate();
        const ref = this.child(id);
        ref[_private].pushed = true;
        if (typeof value !== 'undefined') {
            return ref.set(value, onComplete).then(() => ref);
        }
        else {
            return ref;
        }
    }
    /**
     * Removes this node and all children
     */
    async remove() {
        if (this.isWildcardPath) {
            throw new Error(`Cannot remove wildcard path "/${this.path}". Use query().remove instead`);
        }
        if (this.parent === null) {
            throw new Error('Cannot remove the root node');
        }
        return this.set(null);
    }
    /**
     * Quickly checks if this reference has a value in the database, without returning its data
     * @returns returns a promise that resolves with a boolean value
     */
    async exists() {
        if (this.isWildcardPath) {
            throw new Error(`Cannot check wildcard path "/${this.path}" existence`);
        }
        if (!this.db.isReady) {
            await this.db.ready();
        }
        return this.db.api.exists(this.path);
    }
    get isWildcardPath() {
        return this.path.indexOf('*') >= 0 || this.path.indexOf('$') >= 0;
    }
    /**
     * Creates a query object for current node
     */
    query() {
        return new DataReferenceQuery(this);
    }
    /**
     * Gets the number of children this node has, uses reflection
     */
    async count() {
        const info = await this.reflect('info', { child_count: true });
        return info.children.count;
    }
    async reflect(type, args) {
        if (this.isWildcardPath) {
            throw new Error(`Cannot reflect on wildcard path "/${this.path}"`);
        }
        if (!this.db.isReady) {
            await this.db.ready();
        }
        return this.db.api.reflect(this.path, type, args);
    }
    async export(write, options = { format: 'json', type_safe: true }) {
        if (this.isWildcardPath) {
            throw new Error(`Cannot export wildcard path "/${this.path}"`);
        }
        if (!this.db.isReady) {
            await this.db.ready();
        }
        const writeFn = typeof write === 'function' ? write : write.write.bind(write);
        return this.db.api.export(this.path, writeFn, options);
    }
    /**
     * Imports the value of this node and all children
     * @param read Function that reads data from your stream
     * @param options Only supported format currently is json
     * @returns returns a promise that resolves once all data is imported
     */
    async import(read, options = { format: 'json', suppress_events: false }) {
        if (this.isWildcardPath) {
            throw new Error(`Cannot import to wildcard path "/${this.path}"`);
        }
        if (!this.db.isReady) {
            await this.db.ready();
        }
        return this.db.api.import(this.path, read, options);
    }
    proxy(options) {
        const isOptionsArg = typeof options === 'object' && (typeof options.cursor !== 'undefined' || typeof options.defaultValue !== 'undefined');
        if (typeof options !== 'undefined' && !isOptionsArg) {
            this.db.debug.warn('Warning: live data proxy is being initialized with a deprecated method signature. Use ref.proxy(options) instead of ref.proxy(defaultValue)');
            options = { defaultValue: options };
        }
        return data_proxy_1.LiveDataProxy.create(this, options);
    }
    /**
      * @param options optional initial data retrieval options.
      * Not recommended to use yet - given includes/excludes are not applied to received mutations,
      * or sync actions when using an AceBaseClient with cache db.
      */
    observe(options) {
        // options should not be used yet - we can't prevent/filter mutation events on excluded paths atm
        if (options) {
            throw new Error('observe does not support data retrieval options yet');
        }
        if (this.isWildcardPath) {
            throw new Error(`Cannot observe wildcard path "/${this.path}"`);
        }
        const Observable = (0, optional_observable_1.getObservable)();
        return new Observable(observer => {
            let cache, resolved = false;
            let promise = this.get(options).then(snap => {
                resolved = true;
                cache = snap.val();
                observer.next(cache);
            });
            const updateCache = (snap) => {
                if (!resolved) {
                    promise = promise.then(() => updateCache(snap));
                    return;
                }
                const mutatedPath = snap.ref.path;
                if (mutatedPath === this.path) {
                    cache = snap.val();
                    return observer.next(cache);
                }
                const trailKeys = path_info_1.PathInfo.getPathKeys(mutatedPath).slice(path_info_1.PathInfo.getPathKeys(this.path).length);
                let target = cache;
                while (trailKeys.length > 1) {
                    const key = trailKeys.shift();
                    if (!(key in target)) {
                        // Happens if initial loaded data did not include / excluded this data,
                        // or we missed out on an event
                        target[key] = typeof trailKeys[0] === 'number' ? [] : {};
                    }
                    target = target[key];
                }
                const prop = trailKeys.shift();
                const newValue = snap.val();
                if (newValue === null) {
                    // Remove it
                    target instanceof Array && typeof prop === 'number' ? target.splice(prop, 1) : delete target[prop];
                }
                else {
                    // Set or update it
                    target[prop] = newValue;
                }
                observer.next(cache);
            };
            this.on('mutated', updateCache); // TODO: Refactor to 'mutations' event instead
            // Return unsubscribe function
            return () => {
                this.off('mutated', updateCache);
            };
        });
    }
    async forEach(callbackOrOptions, callback) {
        let options;
        if (typeof callbackOrOptions === 'function') {
            callback = callbackOrOptions;
        }
        else {
            options = callbackOrOptions;
        }
        if (typeof callback !== 'function') {
            throw new TypeError('No callback function given');
        }
        // Get all children through reflection. This could be tweaked further using paging
        const info = await this.reflect('children', { limit: 0, skip: 0 }); // Gets ALL child keys
        const summary = {
            canceled: false,
            total: info.list.length,
            processed: 0,
        };
        // Iterate through all children until callback returns false
        for (let i = 0; i < info.list.length; i++) {
            const key = info.list[i].key;
            // Get child data
            const snapshot = await this.child(key).get(options);
            summary.processed++;
            if (!snapshot.exists()) {
                // Was removed in the meantime, skip
                continue;
            }
            // Run callback
            const result = await callback(snapshot);
            if (result === false) {
                summary.canceled = true;
                break; // Stop looping
            }
        }
        return summary;
    }
    async getMutations(cursorOrDate) {
        const cursor = typeof cursorOrDate === 'string' ? cursorOrDate : undefined;
        const timestamp = cursorOrDate === null || typeof cursorOrDate === 'undefined' ? 0 : cursorOrDate instanceof Date ? cursorOrDate.getTime() : undefined;
        return this.db.api.getMutations({ path: this.path, cursor, timestamp });
    }
    async getChanges(cursorOrDate) {
        const cursor = typeof cursorOrDate === 'string' ? cursorOrDate : undefined;
        const timestamp = cursorOrDate === null || typeof cursorOrDate === 'undefined' ? 0 : cursorOrDate instanceof Date ? cursorOrDate.getTime() : undefined;
        return this.db.api.getChanges({ path: this.path, cursor, timestamp });
    }
}
exports.DataReference = DataReference;
class DataReferenceQuery {
    /**
     * Creates a query on a reference
     */
    constructor(ref) {
        this.ref = ref;
        this[_private] = {
            filters: [],
            skip: 0,
            take: 0,
            order: [],
            events: {},
        };
    }
    /**
     * Applies a filter to the children of the refence being queried.
     * If there is an index on the property key being queried, it will be used
     * to speed up the query
     * @param key property to test value of
     * @param op operator to use
     * @param compare value to compare with
     */
    filter(key, op, compare) {
        if ((op === 'in' || op === '!in') && (!(compare instanceof Array) || compare.length === 0)) {
            throw new Error(`${op} filter for ${key} must supply an Array compare argument containing at least 1 value`);
        }
        if ((op === 'between' || op === '!between') && (!(compare instanceof Array) || compare.length !== 2)) {
            throw new Error(`${op} filter for ${key} must supply an Array compare argument containing 2 values`);
        }
        if ((op === 'matches' || op === '!matches') && !(compare instanceof RegExp)) {
            throw new Error(`${op} filter for ${key} must supply a RegExp compare argument`);
        }
        // DISABLED 2019/10/23 because it is not fully implemented only works locally
        // if (op === "custom" && typeof compare !== "function") {
        //     throw `${op} filter for ${key} must supply a Function compare argument`;
        // }
        // DISABLED 2022/08/15, implemented by query.ts in acebase
        // if ((op === 'contains' || op === '!contains') && ((typeof compare === 'object' && !(compare instanceof Array) && !(compare instanceof Date)) || (compare instanceof Array && compare.length === 0))) {
        //     throw new Error(`${op} filter for ${key} must supply a simple value or (non-zero length) array compare argument`);
        // }
        this[_private].filters.push({ key, op, compare });
        return this;
    }
    /**
     * @deprecated use `.filter` instead
     */
    where(key, op, compare) {
        return this.filter(key, op, compare);
    }
    /**
     * Limits the number of query results
     */
    take(n) {
        this[_private].take = n;
        return this;
    }
    /**
     * Skips the first n query results
     */
    skip(n) {
        this[_private].skip = n;
        return this;
    }
    sort(key, ascending = true) {
        if (!['string', 'number'].includes(typeof key)) {
            throw 'key must be a string or number';
        }
        this[_private].order.push({ key, ascending });
        return this;
    }
    /**
     * @deprecated use `.sort` instead
     */
    order(key, ascending = true) {
        return this.sort(key, ascending);
    }
    get(optionsOrCallback, callback) {
        if (!this.ref.db.isReady) {
            const promise = this.ref.db.ready().then(() => this.get(optionsOrCallback, callback));
            return typeof optionsOrCallback !== 'function' && typeof callback !== 'function' ? promise : undefined; // only return promise if no callback is used
        }
        callback =
            typeof optionsOrCallback === 'function'
                ? optionsOrCallback
                : typeof callback === 'function'
                    ? callback
                    : undefined;
        const options = new QueryDataRetrievalOptions(typeof optionsOrCallback === 'object' ? optionsOrCallback : { snapshots: true, cache_mode: 'allow' });
        options.allow_cache = options.cache_mode !== 'bypass'; // Backward compatibility when using older acebase-client
        options.eventHandler = ev => {
            // TODO: implement context for query events
            if (!this[_private].events[ev.name]) {
                return false;
            }
            const listeners = this[_private].events[ev.name];
            if (typeof listeners !== 'object' || listeners.length === 0) {
                return false;
            }
            if (['add', 'change', 'remove'].includes(ev.name)) {
                const ref = new DataReference(this.ref.db, ev.path);
                const eventData = { name: ev.name };
                if (options.snapshots && ev.name !== 'remove') {
                    const val = db.types.deserialize(ev.path, ev.value);
                    eventData.snapshot = new data_snapshot_1.DataSnapshot(ref, val, false);
                }
                else {
                    eventData.ref = ref;
                }
                ev = eventData;
            }
            listeners.forEach(callback => { try {
                callback(ev);
            }
            catch (e) { } });
        };
        // Check if there are event listeners set for realtime changes
        options.monitor = { add: false, change: false, remove: false };
        if (this[_private].events) {
            if (this[_private].events['add'] && this[_private].events['add'].length > 0) {
                options.monitor.add = true;
            }
            if (this[_private].events['change'] && this[_private].events['change'].length > 0) {
                options.monitor.change = true;
            }
            if (this[_private].events['remove'] && this[_private].events['remove'].length > 0) {
                options.monitor.remove = true;
            }
        }
        // Stop realtime results if they are still enabled on a previous .get on this instance
        this.stop();
        // NOTE: returning promise here, regardless of callback argument. Good argument to refactor method to async/await soon
        const db = this.ref.db;
        return db.api.query(this.ref.path, this[_private], options)
            .catch(err => {
            throw new Error(err);
        })
            .then(res => {
            const { stop } = res;
            let { results, context } = res;
            this.stop = async () => {
                await stop();
            };
            if (!('results' in res && 'context' in res)) {
                console.warn('Query results missing context. Update your acebase and/or acebase-client packages');
                results = res, context = {};
            }
            if (options.snapshots) {
                const snaps = results.map(result => {
                    const val = db.types.deserialize(result.path, result.val);
                    return new data_snapshot_1.DataSnapshot(db.ref(result.path), val, false, undefined, context);
                });
                return DataSnapshotsArray.from(snaps);
            }
            else {
                const refs = results.map(path => db.ref(path));
                return DataReferencesArray.from(refs);
            }
        })
            .then(results => {
            callback && callback(results);
            return results;
        });
    }
    /**
     * Stops a realtime query, no more notifications will be received.
     */
    async stop() {
        // Overridden by .get
    }
    /**
     * Executes the query and returns references. Short for `.get({ snapshots: false })`
     * @param callback callback to use instead of returning a promise
     * @returns returns an Promise that resolves with an array of DataReferences, or void when using a callback
     * @deprecated Use `find` instead
     */
    getRefs(callback) {
        return this.get({ snapshots: false }, callback);
    }
    /**
     * Executes the query and returns an array of references. Short for `.get({ snapshots: false })`
     */
    find() {
        return this.get({ snapshots: false });
    }
    /**
     * Executes the query and returns the number of results
     */
    async count() {
        const refs = await this.find();
        return refs.length;
    }
    /**
     * Executes the query and returns if there are any results
     */
    async exists() {
        const originalTake = this[_private].take;
        const p = this.take(1).find();
        this.take(originalTake);
        const refs = await p;
        return refs.length !== 0;
    }
    /**
     * Executes the query, removes all matches from the database
     * @returns returns a Promise that resolves once all matches have been removed
     */
    async remove(callback) {
        const refs = await this.find();
        // Perform updates on each distinct parent collection (only 1 parent if this is not a wildcard path)
        const parentUpdates = refs.reduce((parents, ref) => {
            const parent = parents[ref.parent.path];
            if (!parent) {
                parents[ref.parent.path] = [ref];
            }
            else {
                parent.push(ref);
            }
            return parents;
        }, {});
        const db = this.ref.db;
        const promises = Object.keys(parentUpdates).map(async (parentPath) => {
            const updates = refs.reduce((updates, ref) => {
                updates[ref.key] = null;
                return updates;
            }, {});
            const ref = db.ref(parentPath);
            try {
                await ref.update(updates);
                return { ref, success: true };
            }
            catch (error) {
                return { ref, success: false, error };
            }
        });
        const results = await Promise.all(promises);
        callback && callback(results);
        return results;
    }
    on(event, callback) {
        if (!this[_private].events[event]) {
            this[_private].events[event] = [];
        }
        this[_private].events[event].push(callback);
        return this;
    }
    /**
     * Unsubscribes from (a) previously added event(s)
     * @param event Name of the event
     * @param callback callback function to remove
     * @returns returns reference to this query
     */
    off(event, callback) {
        if (typeof event === 'undefined') {
            this[_private].events = {};
            return this;
        }
        if (!this[_private].events[event]) {
            return this;
        }
        if (typeof callback === 'undefined') {
            delete this[_private].events[event];
            return this;
        }
        const index = this[_private].events[event].indexOf(callback);
        if (!~index) {
            return this;
        }
        this[_private].events[event].splice(index, 1);
        return this;
    }
    async forEach(callbackOrOptions, callback) {
        let options;
        if (typeof callbackOrOptions === 'function') {
            callback = callbackOrOptions;
        }
        else {
            options = callbackOrOptions;
        }
        if (typeof callback !== 'function') {
            throw new TypeError('No callback function given');
        }
        // Get all query results. This could be tweaked further using paging
        const refs = await this.find();
        const summary = {
            canceled: false,
            total: refs.length,
            processed: 0,
        };
        // Iterate through all children until callback returns false
        for (let i = 0; i < refs.length; i++) {
            const ref = refs[i];
            // Get child data
            const snapshot = await ref.get(options);
            summary.processed++;
            if (!snapshot.exists()) {
                // Was removed in the meantime, skip
                continue;
            }
            // Run callback
            const result = await callback(snapshot);
            if (result === false) {
                summary.canceled = true;
                break; // Stop looping
            }
        }
        return summary;
    }
}
exports.DataReferenceQuery = DataReferenceQuery;
class DataSnapshotsArray extends Array {
    static from(snaps) {
        const arr = new DataSnapshotsArray(snaps.length);
        snaps.forEach((snap, i) => arr[i] = snap);
        return arr;
    }
    getValues() {
        return this.map(snap => snap.val());
    }
}
exports.DataSnapshotsArray = DataSnapshotsArray;
class DataReferencesArray extends Array {
    static from(refs) {
        const arr = new DataReferencesArray(refs.length);
        refs.forEach((ref, i) => arr[i] = ref);
        return arr;
    }
    getPaths() {
        return this.map(ref => ref.path);
    }
}
exports.DataReferencesArray = DataReferencesArray;

},{"./data-proxy":25,"./data-snapshot":27,"./id":29,"./optional-observable":32,"./path-info":34,"./subscription":41}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationsDataSnapshot = exports.DataSnapshot = void 0;
const path_info_1 = require("./path-info");
function getChild(snapshot, path, previous = false) {
    if (!snapshot.exists()) {
        return null;
    }
    let child = previous ? snapshot.previous() : snapshot.val();
    if (typeof path === 'number') {
        return child[path];
    }
    path_info_1.PathInfo.getPathKeys(path).every(key => {
        child = child[key];
        return typeof child !== 'undefined';
    });
    return child || null;
}
function getChildren(snapshot) {
    if (!snapshot.exists()) {
        return [];
    }
    const value = snapshot.val();
    if (value instanceof Array) {
        return new Array(value.length).map((v, i) => i);
    }
    if (typeof value === 'object') {
        return Object.keys(value);
    }
    return [];
}
class DataSnapshot {
    /**
     * Creates a new DataSnapshot instance
     */
    constructor(ref, value, isRemoved = false, prevValue, context) {
        this.ref = ref;
        this.val = () => { return value; };
        this.previous = () => { return prevValue; };
        this.exists = () => {
            if (isRemoved) {
                return false;
            }
            return value !== null && typeof value !== 'undefined';
        };
        this.context = () => { return context || {}; };
    }
    /**
     * Indicates whether the node exists in the database
     */
    exists() { return false; }
    /**
     * @internal (for internal use)
     * Creates a `DataSnapshot` instance
     */
    static for(ref, value) {
        return new DataSnapshot(ref, value);
    }
    /**
     * Gets a new snapshot for a child node
     * @param path child key or path
     * @returns Returns a `DataSnapshot` of the child
     */
    child(path) {
        // Create new snapshot for child data
        const val = getChild(this, path, false);
        const prev = getChild(this, path, true);
        return new DataSnapshot(this.ref.child(path), val, false, prev);
    }
    /**
     * Checks if the snapshot's value has a child with the given key or path
     * @param path child key or path
     */
    hasChild(path) {
        return getChild(this, path) !== null;
    }
    /**
     * Indicates whether the the snapshot's value has any child nodes
     */
    hasChildren() {
        return getChildren(this).length > 0;
    }
    /**
     * The number of child nodes in this snapshot
     */
    numChildren() {
        return getChildren(this).length;
    }
    /**
     * Runs a callback function for each child node in this snapshot until the callback returns false
     * @param callback function that is called with a snapshot of each child node in this snapshot.
     * Must return a boolean value that indicates whether to continue iterating or not.
     */
    forEach(callback) {
        const value = this.val();
        const prev = this.previous();
        return getChildren(this).every((key) => {
            const snap = new DataSnapshot(this.ref.child(key), value[key], false, prev[key]);
            return callback(snap);
        });
    }
    /**
     * The key of the node's path
     */
    get key() { return this.ref.key; }
}
exports.DataSnapshot = DataSnapshot;
class MutationsDataSnapshot extends DataSnapshot {
    constructor(ref, mutations, context) {
        super(ref, mutations, false, undefined, context);
        /**
         * Don't use this to get previous values of mutated nodes.
         * Use `.previous` properties on the individual child snapshots instead.
         * @throws Throws an error if you do use it.
         */
        this.previous = () => { throw new Error('Iterate values to get previous values for each mutation'); };
        this.val = (warn = true) => {
            if (warn) {
                console.warn('Unless you know what you are doing, it is best not to use the value of a mutations snapshot directly. Use child methods and forEach to iterate the mutations instead');
            }
            return mutations;
        };
    }
    /**
     * Runs a callback function for each mutation in this snapshot until the callback returns false
     * @param callback function that is called with a snapshot of each mutation in this snapshot. Must return a boolean value that indicates whether to continue iterating or not.
     * @returns Returns whether every child was interated
     */
    forEach(callback) {
        const mutations = this.val();
        return mutations.every(mutation => {
            const ref = mutation.target.reduce((ref, key) => ref.child(key), this.ref);
            const snap = new DataSnapshot(ref, mutation.val, false, mutation.prev);
            return callback(snap);
        });
    }
    /**
     * Gets a snapshot of a mutated node
     * @param index index of the mutation
     * @returns Returns a DataSnapshot of the mutated node
     */
    child(index) {
        if (typeof index !== 'number') {
            throw new Error('child index must be a number');
        }
        const mutation = this.val()[index];
        const ref = mutation.target.reduce((ref, key) => ref.child(key), this.ref);
        return new DataSnapshot(ref, mutation.val, false, mutation.prev);
    }
}
exports.MutationsDataSnapshot = MutationsDataSnapshot;

},{"./path-info":34}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugLogger = void 0;
const process_1 = require("./process");
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => { };
class DebugLogger {
    constructor(level = 'log', prefix = '') {
        this.level = level;
        this.prefix = prefix;
        this.setLevel(level);
    }
    setLevel(level) {
        const prefix = this.prefix ? this.prefix + ' %s' : '';
        this.verbose = ['verbose'].includes(level) ? prefix ? console.log.bind(console, prefix) : console.log.bind(console) : noop;
        this.log = ['verbose', 'log'].includes(level) ? prefix ? console.log.bind(console, prefix) : console.log.bind(console) : noop;
        this.warn = ['verbose', 'log', 'warn'].includes(level) ? prefix ? console.warn.bind(console, prefix) : console.warn.bind(console) : noop;
        this.error = ['verbose', 'log', 'warn', 'error'].includes(level) ? prefix ? console.error.bind(console, prefix) : console.error.bind(console) : noop;
        this.write = (text) => {
            const isRunKit = typeof process_1.default !== 'undefined' && process_1.default.env && typeof process_1.default.env.RUNKIT_ENDPOINT_PATH === 'string';
            if (text && isRunKit) {
                text.split('\n').forEach(line => console.log(line)); // Logs each line separately
            }
            else {
                console.log(text);
            }
        };
    }
}
exports.DebugLogger = DebugLogger;

},{"./process":36}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ID = void 0;
const cuid_1 = require("./cuid");
// const uuid62 = require('uuid62');
let timeBias = 0;
class ID {
    /**
     * (for internal use)
     * bias in milliseconds to adjust generated cuid timestamps with
     */
    static set timeBias(bias) {
        if (typeof bias !== 'number') {
            return;
        }
        timeBias = bias;
    }
    static generate() {
        // Could also use https://www.npmjs.com/package/pushid for Firebase style 20 char id's
        return (0, cuid_1.default)(timeBias).slice(1); // Cuts off the always leading 'c'
        // return uuid62.v1();
    }
}
exports.ID = ID;

},{"./cuid":23}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectCollection = exports.PartialArray = exports.SchemaDefinition = exports.Colorize = exports.ColorStyle = exports.SimpleEventEmitter = exports.SimpleCache = exports.ascii85 = exports.PathInfo = exports.Utils = exports.TypeMappings = exports.Transport = exports.EventSubscription = exports.EventPublisher = exports.EventStream = exports.PathReference = exports.ID = exports.DebugLogger = exports.OrderedCollectionProxy = exports.proxyAccess = exports.MutationsDataSnapshot = exports.DataSnapshot = exports.DataReferencesArray = exports.DataSnapshotsArray = exports.QueryDataRetrievalOptions = exports.DataRetrievalOptions = exports.DataReferenceQuery = exports.DataReference = exports.Api = exports.AceBaseBaseSettings = exports.AceBaseBase = void 0;
var acebase_base_1 = require("./acebase-base");
Object.defineProperty(exports, "AceBaseBase", { enumerable: true, get: function () { return acebase_base_1.AceBaseBase; } });
Object.defineProperty(exports, "AceBaseBaseSettings", { enumerable: true, get: function () { return acebase_base_1.AceBaseBaseSettings; } });
var api_1 = require("./api");
Object.defineProperty(exports, "Api", { enumerable: true, get: function () { return api_1.Api; } });
var data_reference_1 = require("./data-reference");
Object.defineProperty(exports, "DataReference", { enumerable: true, get: function () { return data_reference_1.DataReference; } });
Object.defineProperty(exports, "DataReferenceQuery", { enumerable: true, get: function () { return data_reference_1.DataReferenceQuery; } });
Object.defineProperty(exports, "DataRetrievalOptions", { enumerable: true, get: function () { return data_reference_1.DataRetrievalOptions; } });
Object.defineProperty(exports, "QueryDataRetrievalOptions", { enumerable: true, get: function () { return data_reference_1.QueryDataRetrievalOptions; } });
Object.defineProperty(exports, "DataSnapshotsArray", { enumerable: true, get: function () { return data_reference_1.DataSnapshotsArray; } });
Object.defineProperty(exports, "DataReferencesArray", { enumerable: true, get: function () { return data_reference_1.DataReferencesArray; } });
var data_snapshot_1 = require("./data-snapshot");
Object.defineProperty(exports, "DataSnapshot", { enumerable: true, get: function () { return data_snapshot_1.DataSnapshot; } });
Object.defineProperty(exports, "MutationsDataSnapshot", { enumerable: true, get: function () { return data_snapshot_1.MutationsDataSnapshot; } });
var data_proxy_1 = require("./data-proxy");
Object.defineProperty(exports, "proxyAccess", { enumerable: true, get: function () { return data_proxy_1.proxyAccess; } });
Object.defineProperty(exports, "OrderedCollectionProxy", { enumerable: true, get: function () { return data_proxy_1.OrderedCollectionProxy; } });
var debug_1 = require("./debug");
Object.defineProperty(exports, "DebugLogger", { enumerable: true, get: function () { return debug_1.DebugLogger; } });
var id_1 = require("./id");
Object.defineProperty(exports, "ID", { enumerable: true, get: function () { return id_1.ID; } });
var path_reference_1 = require("./path-reference");
Object.defineProperty(exports, "PathReference", { enumerable: true, get: function () { return path_reference_1.PathReference; } });
var subscription_1 = require("./subscription");
Object.defineProperty(exports, "EventStream", { enumerable: true, get: function () { return subscription_1.EventStream; } });
Object.defineProperty(exports, "EventPublisher", { enumerable: true, get: function () { return subscription_1.EventPublisher; } });
Object.defineProperty(exports, "EventSubscription", { enumerable: true, get: function () { return subscription_1.EventSubscription; } });
exports.Transport = require("./transport");
var type_mappings_1 = require("./type-mappings");
Object.defineProperty(exports, "TypeMappings", { enumerable: true, get: function () { return type_mappings_1.TypeMappings; } });
exports.Utils = require("./utils");
var path_info_1 = require("./path-info");
Object.defineProperty(exports, "PathInfo", { enumerable: true, get: function () { return path_info_1.PathInfo; } });
var ascii85_1 = require("./ascii85");
Object.defineProperty(exports, "ascii85", { enumerable: true, get: function () { return ascii85_1.ascii85; } });
var simple_cache_1 = require("./simple-cache");
Object.defineProperty(exports, "SimpleCache", { enumerable: true, get: function () { return simple_cache_1.SimpleCache; } });
var simple_event_emitter_1 = require("./simple-event-emitter");
Object.defineProperty(exports, "SimpleEventEmitter", { enumerable: true, get: function () { return simple_event_emitter_1.SimpleEventEmitter; } });
var simple_colors_1 = require("./simple-colors");
Object.defineProperty(exports, "ColorStyle", { enumerable: true, get: function () { return simple_colors_1.ColorStyle; } });
Object.defineProperty(exports, "Colorize", { enumerable: true, get: function () { return simple_colors_1.Colorize; } });
var schema_1 = require("./schema");
Object.defineProperty(exports, "SchemaDefinition", { enumerable: true, get: function () { return schema_1.SchemaDefinition; } });
var partial_array_1 = require("./partial-array");
Object.defineProperty(exports, "PartialArray", { enumerable: true, get: function () { return partial_array_1.PartialArray; } });
var object_collection_1 = require("./object-collection");
Object.defineProperty(exports, "ObjectCollection", { enumerable: true, get: function () { return object_collection_1.ObjectCollection; } });

},{"./acebase-base":19,"./api":20,"./ascii85":21,"./data-proxy":25,"./data-reference":26,"./data-snapshot":27,"./debug":28,"./id":29,"./object-collection":31,"./partial-array":33,"./path-info":34,"./path-reference":35,"./schema":37,"./simple-cache":38,"./simple-colors":39,"./simple-event-emitter":40,"./subscription":41,"./transport":42,"./type-mappings":43,"./utils":44}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectCollection = void 0;
const id_1 = require("./id");
/**
 * Convenience interface for defining an object collection
 * @example
 * type ChatMessage = {
 *    text: string, uid: string, sent: Date
 * }
 * type Chat = {
 *    title: text
 *    messages: ObjectCollection<ChatMessage>
 * }
 */
class ObjectCollection {
    /**
     * Converts and array of values into an object collection, generating a unique key for each item in the array
     * @param array
     * @example
     * const array = [
     *  { title: "Don't make me think!", author: "Steve Krug" },
     *  { title: "The tipping point", author: "Malcolm Gladwell" }
     * ];
     *
     * // Convert:
     * const collection = ObjectCollection.from(array);
     * // --> {
     * //   kh1x3ygb000120r7ipw6biln: {
     * //       title: "Don't make me think!",
     * //       author: "Steve Krug"
     * //   },
     * //   kh1x3ygb000220r757ybpyec: {
     * //       title: "The tipping point",
     * //       author: "Malcolm Gladwell"
     * //   }
     * // }
     *
     * // Now it's easy to add them to the db:
     * db.ref('books').update(collection);
     */
    static from(array) {
        const collection = {};
        array.forEach(child => {
            collection[id_1.ID.generate()] = child;
        });
        return collection;
    }
}
exports.ObjectCollection = ObjectCollection;

},{"./id":29}],32:[function(require,module,exports){
"use strict";
// Optional dependency on rxjs package. If rxjs is installed into your project, you'll get the correct
// typings for AceBase methods that use Observables, and you'll be able to use them. If you don't use
// those methods, there is no need to install rxjs.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservableShim = exports.setObservable = exports.getObservable = void 0;
let _observable;
function getObservable() {
    if (_observable) {
        return _observable;
    }
    if (typeof window !== 'undefined' && window.Observable) {
        _observable = window.Observable;
        return _observable;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Observable } = require('rxjs'); // fails in ESM module, need an elegant way to handle this. Can't use dynamic import() because it 1) requires Node 12+ and 2) causes Webpack build to fail if rxjs is not installed
        if (!Observable) {
            throw new Error('not loaded');
        }
        _observable = Observable;
        return Observable;
    }
    catch (err) {
        throw new Error('RxJS Observable could not be loaded. If you are using a browser build, add it to AceBase using db.setObservable. For node.js builds, add it to your project with: npm i rxjs');
    }
}
exports.getObservable = getObservable;
function setObservable(Observable) {
    if (Observable === 'shim') {
        console.warn('Using AceBase\'s simple Observable shim. Only use this if you know what you\'re doing.');
        Observable = ObservableShim;
    }
    _observable = Observable;
}
exports.setObservable = setObservable;
/**
 * rxjs is an optional dependency that only needs installing when any of AceBase's observe methods are used.
 * If for some reason rxjs is not available (eg in test suite), we can provide a shim. This class is used when
 * `db.setObservable("shim")` is called
 */
class ObservableShim {
    constructor(create) {
        this._active = false;
        this._subscribers = [];
        this._create = create;
    }
    subscribe(subscriber) {
        if (!this._active) {
            const next = (value) => {
                // emit value to all subscribers
                this._subscribers.forEach(s => {
                    try {
                        s(value);
                    }
                    catch (err) {
                        console.error('Error in subscriber callback:', err);
                    }
                });
            };
            const observer = { next };
            this._cleanup = this._create(observer);
            this._active = true;
        }
        this._subscribers.push(subscriber);
        const unsubscribe = () => {
            this._subscribers.splice(this._subscribers.indexOf(subscriber), 1);
            if (this._subscribers.length === 0) {
                this._active = false;
                this._cleanup();
            }
        };
        const subscription = {
            unsubscribe,
        };
        return subscription;
    }
}
exports.ObservableShim = ObservableShim;

},{"rxjs":15}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialArray = void 0;
/**
 * Sparse/partial array converted to a serializable object. Use `Object.keys(sparseArray)` and `Object.values(sparseArray)` to iterate its indice and/or values
 */
class PartialArray {
    constructor(sparseArray) {
        if (sparseArray instanceof Array) {
            for (let i = 0; i < sparseArray.length; i++) {
                if (typeof sparseArray[i] !== 'undefined') {
                    this[i] = sparseArray[i];
                }
            }
        }
        else if (sparseArray) {
            Object.assign(this, sparseArray);
        }
    }
}
exports.PartialArray = PartialArray;

},{}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathInfo = void 0;
function getPathKeys(path) {
    path = path.replace(/\[/g, '/[').replace(/^\/+/, '').replace(/\/+$/, ''); // Replace [ with /[, remove leading slashes, remove trailing slashes
    if (path.length === 0) {
        return [];
    }
    const keys = path.split('/');
    return keys.map(key => {
        return key.startsWith('[') ? parseInt(key.slice(1, -1)) : key;
    });
}
class PathInfo {
    constructor(path) {
        if (typeof path === 'string') {
            this.keys = getPathKeys(path);
        }
        else if (path instanceof Array) {
            this.keys = path;
        }
        this.path = this.keys.reduce((path, key, i) => i === 0 ? `${key}` : typeof key === 'string' ? `${path}/${key}` : `${path}[${key}]`, '');
    }
    static get(path) {
        return new PathInfo(path);
    }
    static getChildPath(path, childKey) {
        // return getChildPath(path, childKey);
        return PathInfo.get(path).child(childKey).path;
    }
    static getPathKeys(path) {
        return getPathKeys(path);
    }
    get key() {
        return this.keys.length === 0 ? null : this.keys.slice(-1)[0];
    }
    get parent() {
        if (this.keys.length == 0) {
            return null;
        }
        const parentKeys = this.keys.slice(0, -1);
        return new PathInfo(parentKeys);
    }
    get parentPath() {
        return this.keys.length === 0 ? null : this.parent.path;
    }
    child(childKey) {
        if (typeof childKey === 'string') {
            childKey = getPathKeys(childKey);
        }
        return new PathInfo(this.keys.concat(childKey));
    }
    childPath(childKey) {
        return this.child(childKey).path;
    }
    get pathKeys() {
        return this.keys;
    }
    /**
     * If varPath contains variables or wildcards, it will return them with the values found in fullPath
     * @param {string} varPath path containing variables such as * and $name
     * @param {string} fullPath real path to a node
     * @returns {{ [index: number]: string|number, [variable: string]: string|number }} returns an array-like object with all variable values. All named variables are also set on the array by their name (eg vars.uid and vars.$uid)
     * @example
     * PathInfo.extractVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === {
     *  0: 'ewout',
     *  1: 'post1',
     *  uid: 'ewout', // or $uid
     *  postid: 'post1' // or $postid
     * };
     *
     * PathInfo.extractVariables('users/*\/posts/*\/$property', 'users/ewout/posts/post1/title') === {
     *  0: 'ewout',
     *  1: 'post1',
     *  2: 'title',
     *  property: 'title' // or $property
     * };
     *
     * PathInfo.extractVariables('users/$user/friends[*]/$friend', 'users/dora/friends[4]/diego') === {
     *  0: 'dora',
     *  1: 4,
     *  2: 'diego',
     *  user: 'dora', // or $user
     *  friend: 'diego' // or $friend
     * };
    */
    static extractVariables(varPath, fullPath) {
        if (!varPath.includes('*') && !varPath.includes('$')) {
            return [];
        }
        // if (!this.equals(fullPath)) {
        //     throw new Error(`path does not match with the path of this PathInfo instance: info.equals(path) === false!`)
        // }
        const keys = getPathKeys(varPath);
        const pathKeys = getPathKeys(fullPath);
        let count = 0;
        const variables = {
            get length() { return count; },
        };
        keys.forEach((key, index) => {
            const pathKey = pathKeys[index];
            if (key === '*') {
                variables[count++] = pathKey;
            }
            else if (typeof key === 'string' && key[0] === '$') {
                variables[count++] = pathKey;
                // Set the $variable property
                variables[key] = pathKey;
                // Set friendly property name (without $)
                const varName = key.slice(1);
                if (typeof variables[varName] === 'undefined') {
                    variables[varName] = pathKey;
                }
            }
        });
        return variables;
    }
    /**
     * If varPath contains variables or wildcards, it will return a path with the variables replaced by the keys found in fullPath.
     * @example
     * PathInfo.fillVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === 'users/ewout/posts/post1'
     */
    static fillVariables(varPath, fullPath) {
        if (varPath.indexOf('*') < 0 && varPath.indexOf('$') < 0) {
            return varPath;
        }
        const keys = getPathKeys(varPath);
        const pathKeys = getPathKeys(fullPath);
        const merged = keys.map((key, index) => {
            if (key === pathKeys[index] || index >= pathKeys.length) {
                return key;
            }
            else if (typeof key === 'string' && (key === '*' || key[0] === '$')) {
                return pathKeys[index];
            }
            else {
                throw new Error(`Path "${fullPath}" cannot be used to fill variables of path "${varPath}" because they do not match`);
            }
        });
        let mergedPath = '';
        merged.forEach(key => {
            if (typeof key === 'number') {
                mergedPath += `[${key}]`;
            }
            else {
                if (mergedPath.length > 0) {
                    mergedPath += '/';
                }
                mergedPath += key;
            }
        });
        return mergedPath;
    }
    /**
     * Replaces all variables in a path with the values in the vars argument
     * @param varPath path containing variables
     * @param vars variables object such as one gotten from PathInfo.extractVariables
     */
    static fillVariables2(varPath, vars) {
        if (typeof vars !== 'object' || Object.keys(vars).length === 0) {
            return varPath; // Nothing to fill
        }
        const pathKeys = getPathKeys(varPath);
        let n = 0;
        const targetPath = pathKeys.reduce((path, key) => {
            if (typeof key === 'string' && (key === '*' || key.startsWith('$'))) {
                return PathInfo.getChildPath(path, vars[n++]);
            }
            else {
                return PathInfo.getChildPath(path, key);
            }
        }, '');
        return targetPath;
    }
    /**
     * Checks if a given path matches this path, eg "posts/*\/title" matches "posts/12344/title" and "users/123/name" matches "users/$uid/name"
     */
    equals(otherPath) {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (this.path === other.path) {
            return true;
        } // they are identical
        if (this.keys.length !== other.keys.length) {
            return false;
        }
        return this.keys.every((key, index) => {
            const otherKey = other.keys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === '*' || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === '*' || key[0] === '$'));
        });
    }
    /**
     * Checks if a given path is an ancestor, eg "posts" is an ancestor of "posts/12344/title"
     */
    isAncestorOf(descendantPath) {
        const descendant = descendantPath instanceof PathInfo ? descendantPath : new PathInfo(descendantPath);
        if (descendant.path === '' || this.path === descendant.path) {
            return false;
        }
        if (this.path === '') {
            return true;
        }
        if (this.keys.length >= descendant.keys.length) {
            return false;
        }
        return this.keys.every((key, index) => {
            const otherKey = descendant.keys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === '*' || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === '*' || key[0] === '$'));
        });
    }
    /**
     * Checks if a given path is a descendant, eg "posts/1234/title" is a descendant of "posts"
     */
    isDescendantOf(ancestorPath) {
        const ancestor = ancestorPath instanceof PathInfo ? ancestorPath : new PathInfo(ancestorPath);
        if (this.path === '' || this.path === ancestor.path) {
            return false;
        }
        if (ancestorPath === '') {
            return true;
        }
        if (ancestor.keys.length >= this.keys.length) {
            return false;
        }
        return ancestor.keys.every((key, index) => {
            const otherKey = this.keys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === '*' || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === '*' || key[0] === '$'));
        });
    }
    /**
     * Checks if the other path is on the same trail as this path. Paths on the same trail if they share a
     * common ancestor. Eg: "posts" is on the trail of "posts/1234/title" and vice versa.
     */
    isOnTrailOf(otherPath) {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (this.path.length === 0 || other.path.length === 0) {
            return true;
        }
        if (this.path === other.path) {
            return true;
        }
        return this.pathKeys.every((key, index) => {
            if (index >= other.keys.length) {
                return true;
            }
            const otherKey = other.keys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === '*' || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === '*' || key[0] === '$'));
        });
    }
    /**
     * Checks if a given path is a direct child, eg "posts/1234/title" is a child of "posts/1234"
     */
    isChildOf(otherPath) {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (this.path === '') {
            return false;
        } // If our path is the root, it's nobody's child...
        return this.parent.equals(other);
    }
    /**
     * Checks if a given path is its parent, eg "posts/1234" is the parent of "posts/1234/title"
     */
    isParentOf(otherPath) {
        const other = otherPath instanceof PathInfo ? otherPath : new PathInfo(otherPath);
        if (other.path === '') {
            return false;
        } // If the other path is the root, this path cannot be its parent
        return this.equals(other.parent);
    }
}
exports.PathInfo = PathInfo;

},{}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathReference = void 0;
class PathReference {
    /**
     * Creates a reference to a path that can be stored in the database. Use this to create cross-references to other data in your database
     * @param path
     */
    constructor(path) {
        this.path = path;
    }
}
exports.PathReference = PathReference;

},{}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    nextTick(fn) {
        setTimeout(fn, 0);
    },
};

},{}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaDefinition = void 0;
// parses a typestring, creates checker functions
function parse(definition) {
    // tokenize
    let pos = 0;
    function consumeSpaces() {
        let c;
        while (c = definition[pos], [' ', '\r', '\n', '\t'].includes(c)) {
            pos++;
        }
    }
    function consumeCharacter(c) {
        if (definition[pos] !== c) {
            throw new Error(`Unexpected character at position ${pos}. Expected: '${c}', found '${definition[pos]}'`);
        }
        pos++;
    }
    function readProperty() {
        consumeSpaces();
        const prop = { name: '', optional: false, wildcard: false };
        let c;
        while (c = definition[pos], c === '_' || c === '$' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (prop.name.length > 0 && c >= '0' && c <= '9') || (prop.name.length === 0 && c === '*')) {
            prop.name += c;
            pos++;
        }
        if (prop.name.length === 0) {
            throw new Error(`Property name expected at position ${pos}, found: ${definition.slice(pos, pos + 10)}..`);
        }
        if (definition[pos] === '?') {
            prop.optional = true;
            pos++;
        }
        if (prop.name === '*' || prop.name[0] === '$') {
            prop.optional = true;
            prop.wildcard = true;
        }
        consumeSpaces();
        consumeCharacter(':');
        return prop;
    }
    function readType() {
        consumeSpaces();
        let type = { typeOf: 'any' }, c;
        // try reading simple type first: (string,number,boolean,Date etc)
        let name = '';
        while (c = definition[pos], (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
            name += c;
            pos++;
        }
        if (name.length === 0) {
            if (definition[pos] === '*') {
                // any value
                consumeCharacter('*');
                type.typeOf = 'any';
            }
            else if (['\'', '"', '`'].includes(definition[pos])) {
                // Read string value
                type.typeOf = 'string';
                type.value = '';
                const quote = definition[pos];
                consumeCharacter(quote);
                while (c = definition[pos], c && c !== quote) {
                    type.value += c;
                    pos++;
                }
                consumeCharacter(quote);
            }
            else if (definition[pos] >= '0' && definition[pos] <= '9') {
                // read numeric value
                type.typeOf = 'number';
                let nr = '';
                while (c = definition[pos], c === '.' || c === 'n' || (c >= '0' && c <= '9')) {
                    nr += c;
                    pos++;
                }
                if (nr.endsWith('n')) {
                    type.value = BigInt(nr);
                }
                else if (nr.includes('.')) {
                    type.value = parseFloat(nr);
                }
                else {
                    type.value = parseInt(nr);
                }
            }
            else if (definition[pos] === '{') {
                // Read object (interface) definition
                consumeCharacter('{');
                type.typeOf = 'object';
                type.instanceOf = Object;
                // Read children:
                type.children = [];
                while (true) {
                    const prop = readProperty();
                    const types = readTypes();
                    type.children.push({ name: prop.name, optional: prop.optional, wildcard: prop.wildcard, types });
                    consumeSpaces();
                    if (definition[pos] === '}') {
                        break;
                    }
                    consumeCharacter(',');
                }
                consumeCharacter('}');
            }
            else if (definition[pos] === '/') {
                // Read regular expression definition
                consumeCharacter('/');
                let pattern = '', flags = '';
                while (c = definition[pos], c !== '/' || pattern.endsWith('\\')) {
                    pattern += c;
                    pos++;
                }
                consumeCharacter('/');
                while (c = definition[pos], ['g', 'i', 'm', 's', 'u', 'y', 'd'].includes(c)) {
                    flags += c;
                    pos++;
                }
                type.typeOf = 'string';
                type.matches = new RegExp(pattern, flags);
            }
            else {
                throw new Error(`Expected a type definition at position ${pos}, found character '${definition[pos]}'`);
            }
        }
        else if (['string', 'number', 'boolean', 'bigint', 'undefined', 'String', 'Number', 'Boolean', 'BigInt'].includes(name)) {
            type.typeOf = name.toLowerCase();
        }
        else if (name === 'Object' || name === 'object') {
            type.typeOf = 'object';
            type.instanceOf = Object;
        }
        else if (name === 'Date') {
            type.typeOf = 'object';
            type.instanceOf = Date;
        }
        else if (name === 'Binary' || name === 'binary') {
            type.typeOf = 'object';
            type.instanceOf = ArrayBuffer;
        }
        else if (name === 'any') {
            type.typeOf = 'any';
        }
        else if (name === 'null') {
            // This is ignored, null values are not stored in the db (null indicates deletion)
            type.typeOf = 'object';
            type.value = null;
        }
        else if (name === 'Array') {
            // Read generic Array defintion
            consumeCharacter('<');
            type.typeOf = 'object';
            type.instanceOf = Array; //name;
            type.genericTypes = readTypes();
            consumeCharacter('>');
        }
        else if (['true', 'false'].includes(name)) {
            type.typeOf = 'boolean';
            type.value = name === 'true';
        }
        else {
            throw new Error(`Unknown type at position ${pos}: "${type}"`);
        }
        // Check if it's an Array of given type (eg: string[] or string[][])
        // Also converts to generics, string[] becomes Array<string>, string[][] becomes Array<Array<string>>
        consumeSpaces();
        while (definition[pos] === '[') {
            consumeCharacter('[');
            consumeCharacter(']');
            type = { typeOf: 'object', instanceOf: Array, genericTypes: [type] };
        }
        return type;
    }
    function readTypes() {
        consumeSpaces();
        const types = [readType()];
        while (definition[pos] === '|') {
            consumeCharacter('|');
            types.push(readType());
            consumeSpaces();
        }
        return types;
    }
    return readType();
}
function checkObject(path, properties, obj, partial) {
    // Are there any properties that should not be in there?
    const invalidProperties = properties.find(prop => prop.name === '*' || prop.name[0] === '$') // Only if no wildcard properties are allowed
        ? []
        : Object.keys(obj).filter(key => ![null, undefined].includes(obj[key]) // Ignore null or undefined values
            && !properties.find(prop => prop.name === key));
    if (invalidProperties.length > 0) {
        return { ok: false, reason: `Object at path "${path}" cannot have propert${invalidProperties.length === 1 ? 'y' : 'ies'} ${invalidProperties.map(p => `"${p}"`).join(', ')}` };
    }
    // Loop through properties that should be present
    function checkProperty(property) {
        const hasValue = ![null, undefined].includes(obj[property.name]);
        if (!property.optional && (partial ? obj[property.name] === null : !hasValue)) {
            return { ok: false, reason: `Property at path "${path}/${property.name}" is not optional` };
        }
        if (hasValue && property.types.length === 1) {
            return checkType(`${path}/${property.name}`, property.types[0], obj[property.name], false);
        }
        if (hasValue && !property.types.some(type => checkType(`${path}/${property.name}`, type, obj[property.name], false).ok)) {
            return { ok: false, reason: `Property at path "${path}/${property.name}" does not match any of ${property.types.length} allowed types` };
        }
        return { ok: true };
    }
    const namedProperties = properties.filter(prop => !prop.wildcard);
    const failedProperty = namedProperties.find(prop => !checkProperty(prop).ok);
    if (failedProperty) {
        const reason = checkProperty(failedProperty).reason;
        return { ok: false, reason };
    }
    const wildcardProperty = properties.find(prop => prop.wildcard);
    if (!wildcardProperty) {
        return { ok: true };
    }
    const wildcardChildKeys = Object.keys(obj).filter(key => !namedProperties.find(prop => prop.name === key));
    let result = { ok: true };
    for (let i = 0; i < wildcardChildKeys.length && result.ok; i++) {
        const childKey = wildcardChildKeys[i];
        result = checkProperty({ name: childKey, types: wildcardProperty.types, optional: true, wildcard: true });
    }
    return result;
}
function checkType(path, type, value, partial, trailKeys) {
    const ok = { ok: true };
    if (type.typeOf === 'any') {
        return ok;
    }
    if (trailKeys instanceof Array && trailKeys.length > 0) {
        // The value to check resides in a descendant path of given type definition.
        // Recursivly check child type definitions to find a match
        if (type.typeOf !== 'object') {
            return { ok: false, reason: `path "${path}" must be typeof ${type.typeOf}` }; // given value resides in a child path, but parent is not allowed be an object.
        }
        if (!type.children) {
            return ok;
        }
        const childKey = trailKeys[0];
        let property = type.children.find(prop => prop.name === childKey);
        if (!property) {
            property = type.children.find(prop => prop.name === '*' || prop.name[0] === '$');
        }
        if (!property) {
            return { ok: false, reason: `Object at path "${path}" cannot have property "${childKey}"` };
        }
        if (property.optional && value === null && trailKeys.length === 1) {
            return ok;
        }
        let result;
        property.types.some(type => {
            const childPath = typeof childKey === 'number' ? `${path}[${childKey}]` : `${path}/${childKey}`;
            result = checkType(childPath, type, value, partial, trailKeys.slice(1));
            return result.ok;
        });
        return result;
    }
    if (value === null) {
        return ok;
    }
    if (type.instanceOf === Object && (typeof value !== 'object' || value instanceof Array || value instanceof Date)) {
        return { ok: false, reason: `path "${path}" must be an object collection` };
    }
    if (type.instanceOf && (typeof value !== 'object' || value.constructor !== type.instanceOf)) { // !(value instanceof type.instanceOf) // value.constructor.name !== type.instanceOf
        return { ok: false, reason: `path "${path}" must be an instance of ${type.instanceOf.name}` };
    }
    if ('value' in type && value !== type.value) {
        return { ok: false, reason: `path "${path}" must be value: ${type.value}` };
    }
    if (typeof value !== type.typeOf) {
        return { ok: false, reason: `path "${path}" must be typeof ${type.typeOf}` };
    }
    if (type.instanceOf === Array && type.genericTypes && !value.every(v => type.genericTypes.some(t => checkType(path, t, v, false).ok))) {
        return { ok: false, reason: `every array value of path "${path}" must match one of the specified types` };
    }
    if (type.typeOf === 'object' && type.children) {
        return checkObject(path, type.children, value, partial);
    }
    if (type.matches && !type.matches.test(value)) {
        return { ok: false, reason: `path "${path}" must match regular expression /${type.matches.source}/${type.matches.flags}` };
    }
    return ok;
}
// eslint-disable-next-line @typescript-eslint/ban-types
function getConstructorType(val) {
    switch (val) {
        case String: return 'string';
        case Number: return 'number';
        case Boolean: return 'boolean';
        case Date: return 'Date';
        case BigInt: return 'bigint';
        case Array: throw new Error('Schema error: Array cannot be used without a type. Use string[] or Array<string> instead');
        default: throw new Error(`Schema error: unknown type used: ${val.name}`);
    }
}
class SchemaDefinition {
    constructor(definition) {
        this.source = definition;
        if (typeof definition === 'object') {
            // Turn object into typescript definitions
            // eg:
            // const example = {
            //     name: String,
            //     born: Date,
            //     instrument: "'guitar'|'piano'",
            //     "address?": {
            //         street: String
            //     }
            // };
            // Resulting ts: "{name:string,born:Date,instrument:'guitar'|'piano',address?:{street:string}}"
            const toTS = obj => {
                return '{' + Object.keys(obj)
                    .map(key => {
                    let val = obj[key];
                    if (val === undefined) {
                        val = 'undefined';
                    }
                    else if (val instanceof RegExp) {
                        val = `/${val.source}/${val.flags}`;
                    }
                    else if (typeof val === 'object') {
                        val = toTS(val);
                    }
                    else if (typeof val === 'function') {
                        val = getConstructorType(val);
                    }
                    else if (!['string', 'number', 'boolean', 'bigint'].includes(typeof val)) {
                        throw new Error(`Type definition for key "${key}" must be a string, number, boolean, bigint, object, regular expression, or one of these classes: String, Number, Boolean, Date, BigInt`);
                    }
                    return `${key}:${val}`;
                })
                    .join(',') + '}';
            };
            this.text = toTS(definition);
        }
        else if (typeof definition === 'string') {
            this.text = definition;
        }
        else {
            throw new Error('Type definiton must be a string or an object');
        }
        this.type = parse(this.text);
    }
    check(path, value, partial, trailKeys) {
        return checkType(path, this.type, value, partial, trailKeys);
    }
}
exports.SchemaDefinition = SchemaDefinition;

},{}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCache = void 0;
const utils_1 = require("./utils");
const calculateExpiryTime = (expirySeconds) => expirySeconds > 0 ? Date.now() + (expirySeconds * 1000) : Infinity;
/**
 * Simple cache implementation that retains immutable values in memory for a limited time.
 * Immutability is enforced by cloning the stored and retrieved values. To change a cached value, it will have to be `set` again with the new value.
 */
class SimpleCache {
    constructor(options) {
        var _a;
        this.enabled = true;
        if (typeof options === 'number') {
            // Old signature: only expirySeconds given
            options = { expirySeconds: options };
        }
        options.cloneValues = options.cloneValues !== false;
        if (typeof options.expirySeconds !== 'number' && typeof options.maxEntries !== 'number') {
            throw new Error('Either expirySeconds or maxEntries must be specified');
        }
        this.options = options;
        this.cache = new Map();
        // Cleanup every minute
        const interval = setInterval(() => { this.cleanUp(); }, 60 * 1000);
        (_a = interval.unref) === null || _a === void 0 ? void 0 : _a.call(interval);
    }
    get size() { return this.cache.size; }
    has(key) {
        if (!this.enabled) {
            return false;
        }
        return this.cache.has(key);
    }
    get(key) {
        if (!this.enabled) {
            return null;
        }
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        } // if (!entry || entry.expires <= Date.now()) { return null; }
        entry.expires = calculateExpiryTime(this.options.expirySeconds);
        entry.accessed = Date.now();
        return this.options.cloneValues ? (0, utils_1.cloneObject)(entry.value) : entry.value;
    }
    set(key, value) {
        if (this.options.maxEntries > 0 && this.cache.size >= this.options.maxEntries && !this.cache.has(key)) {
            // console.warn(`* cache limit ${this.options.maxEntries} reached: ${this.cache.size}`);
            // Remove an expired item or the one that was accessed longest ago
            let oldest = null;
            const now = Date.now();
            for (const [key, entry] of this.cache.entries()) {
                if (entry.expires <= now) {
                    // Found an expired item. Remove it now and stop
                    this.cache.delete(key);
                    oldest = null;
                    break;
                }
                if (!oldest || entry.accessed < oldest.accessed) {
                    oldest = { key, accessed: entry.accessed };
                }
            }
            if (oldest !== null) {
                this.cache.delete(oldest.key);
            }
        }
        this.cache.set(key, { value: this.options.cloneValues ? (0, utils_1.cloneObject)(value) : value, added: Date.now(), accessed: Date.now(), expires: calculateExpiryTime(this.options.expirySeconds) });
    }
    remove(key) {
        this.cache.delete(key);
    }
    cleanUp() {
        const now = Date.now();
        this.cache.forEach((entry, key) => {
            if (entry.expires <= now) {
                this.cache.delete(key);
            }
        });
    }
}
exports.SimpleCache = SimpleCache;

},{"./utils":44}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Colorize = exports.SetColorsEnabled = exports.ColorsSupported = exports.ColorStyle = void 0;
const process_1 = require("./process");
// See from https://en.wikipedia.org/wiki/ANSI_escape_code
const FontCode = {
    bold: 1,
    dim: 2,
    italic: 3,
    underline: 4,
    inverse: 7,
    hidden: 8,
    strikethrough: 94,
};
const ColorCode = {
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
    grey: 90,
    // Bright colors:
    brightRed: 91,
    // TODO, other bright colors
};
const BgColorCode = {
    bgBlack: 40,
    bgRed: 41,
    bgGreen: 42,
    bgYellow: 43,
    bgBlue: 44,
    bgMagenta: 45,
    bgCyan: 46,
    bgWhite: 47,
    bgGrey: 100,
    bgBrightRed: 101,
    // TODO, other bright colors
};
const ResetCode = {
    all: 0,
    color: 39,
    background: 49,
    bold: 22,
    dim: 22,
    italic: 23,
    underline: 24,
    inverse: 27,
    hidden: 28,
    strikethrough: 29,
};
var ColorStyle;
(function (ColorStyle) {
    ColorStyle["reset"] = "reset";
    ColorStyle["bold"] = "bold";
    ColorStyle["dim"] = "dim";
    ColorStyle["italic"] = "italic";
    ColorStyle["underline"] = "underline";
    ColorStyle["inverse"] = "inverse";
    ColorStyle["hidden"] = "hidden";
    ColorStyle["strikethrough"] = "strikethrough";
    ColorStyle["black"] = "black";
    ColorStyle["red"] = "red";
    ColorStyle["green"] = "green";
    ColorStyle["yellow"] = "yellow";
    ColorStyle["blue"] = "blue";
    ColorStyle["magenta"] = "magenta";
    ColorStyle["cyan"] = "cyan";
    ColorStyle["grey"] = "grey";
    ColorStyle["bgBlack"] = "bgBlack";
    ColorStyle["bgRed"] = "bgRed";
    ColorStyle["bgGreen"] = "bgGreen";
    ColorStyle["bgYellow"] = "bgYellow";
    ColorStyle["bgBlue"] = "bgBlue";
    ColorStyle["bgMagenta"] = "bgMagenta";
    ColorStyle["bgCyan"] = "bgCyan";
    ColorStyle["bgWhite"] = "bgWhite";
    ColorStyle["bgGrey"] = "bgGrey";
})(ColorStyle = exports.ColorStyle || (exports.ColorStyle = {}));
function ColorsSupported() {
    // Checks for basic color support
    if (typeof process_1.default === 'undefined' || !process_1.default.stdout || !process_1.default.env || !process_1.default.platform || process_1.default.platform === 'browser') {
        return false;
    }
    if (process_1.default.platform === 'win32') {
        return true;
    }
    const env = process_1.default.env;
    if (env.COLORTERM) {
        return true;
    }
    if (env.TERM === 'dumb') {
        return false;
    }
    if (env.CI || env.TEAMCITY_VERSION) {
        return !!env.TRAVIS;
    }
    if (['iTerm.app', 'HyperTerm', 'Hyper', 'MacTerm', 'Apple_Terminal', 'vscode'].includes(env.TERM_PROGRAM)) {
        return true;
    }
    if (/^xterm-256|^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return true;
    }
    return false;
}
exports.ColorsSupported = ColorsSupported;
let _enabled = ColorsSupported();
function SetColorsEnabled(enabled) {
    _enabled = ColorsSupported() && enabled;
}
exports.SetColorsEnabled = SetColorsEnabled;
function Colorize(str, style) {
    if (!_enabled) {
        return str;
    }
    const openCodes = [], closeCodes = [];
    const addStyle = style => {
        if (style === ColorStyle.reset) {
            openCodes.push(ResetCode.all);
        }
        else if (style in FontCode) {
            openCodes.push(FontCode[style]);
            closeCodes.push(ResetCode[style]);
        }
        else if (style in ColorCode) {
            openCodes.push(ColorCode[style]);
            closeCodes.push(ResetCode.color);
        }
        else if (style in BgColorCode) {
            openCodes.push(BgColorCode[style]);
            closeCodes.push(ResetCode.background);
        }
    };
    if (style instanceof Array) {
        style.forEach(addStyle);
    }
    else {
        addStyle(style);
    }
    // const open = '\u001b[' + openCodes.join(';') + 'm';
    // const close = '\u001b[' + closeCodes.join(';') + 'm';
    const open = openCodes.map(code => '\u001b[' + code + 'm').join('');
    const close = closeCodes.map(code => '\u001b[' + code + 'm').join('');
    // return open + str + close;
    return str.split('\n').map(line => open + line + close).join('\n');
}
exports.Colorize = Colorize;
String.prototype.colorize = function (style) {
    return Colorize(this, style);
};

},{"./process":36}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleEventEmitter = void 0;
function runCallback(callback, data) {
    try {
        callback(data);
    }
    catch (err) {
        console.error('Error in subscription callback', err);
    }
}
class SimpleEventEmitter {
    constructor() {
        this._subscriptions = [];
        this._oneTimeEvents = new Map();
    }
    on(event, callback) {
        if (this._oneTimeEvents.has(event)) {
            return runCallback(callback, this._oneTimeEvents.get(event));
        }
        this._subscriptions.push({ event, callback, once: false });
        return this;
    }
    off(event, callback) {
        this._subscriptions = this._subscriptions.filter(s => s.event !== event || (callback && s.callback !== callback));
        return this;
    }
    once(event, callback) {
        return new Promise(resolve => {
            const ourCallback = (data) => {
                resolve(data);
                callback === null || callback === void 0 ? void 0 : callback(data);
            };
            if (this._oneTimeEvents.has(event)) {
                runCallback(ourCallback, this._oneTimeEvents.get(event));
            }
            else {
                this._subscriptions.push({ event, callback: ourCallback, once: true });
            }
        });
    }
    emit(event, data) {
        if (this._oneTimeEvents.has(event)) {
            throw new Error(`Event "${event}" was supposed to be emitted only once`);
        }
        for (let i = 0; i < this._subscriptions.length; i++) {
            const s = this._subscriptions[i];
            if (s.event !== event) {
                continue;
            }
            runCallback(s.callback, data);
            if (s.once) {
                this._subscriptions.splice(i, 1);
                i--;
            }
        }
        return this;
    }
    emitOnce(event, data) {
        if (this._oneTimeEvents.has(event)) {
            throw new Error(`Event "${event}" was supposed to be emitted only once`);
        }
        this.emit(event, data);
        this._oneTimeEvents.set(event, data); // Mark event as being emitted once for future subscribers
        this.off(event); // Remove all listeners for this event, they won't fire again
        return this;
    }
}
exports.SimpleEventEmitter = SimpleEventEmitter;

},{}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStream = exports.EventPublisher = exports.EventSubscription = void 0;
class EventSubscription {
    /**
     * @param stop function that stops the subscription from receiving future events
     */
    constructor(stop) {
        this.stop = stop;
        this._internal = {
            state: 'init',
            activatePromises: [],
        };
    }
    /**
     * Notifies when subscription is activated or canceled
     * @param callback optional callback to run each time activation state changes
     * @returns returns a promise that resolves once activated, or rejects when it is denied (and no callback was supplied)
     */
    activated(callback) {
        if (callback) {
            this._internal.activatePromises.push({ callback });
            if (this._internal.state === 'active') {
                callback(true);
            }
            else if (this._internal.state === 'canceled') {
                callback(false, this._internal.cancelReason);
            }
        }
        // Changed behaviour: now also returns a Promise when the callback is used.
        // This allows for 1 activated call to both handle: first activation result,
        // and any future events using the callback
        return new Promise((resolve, reject) => {
            if (this._internal.state === 'active') {
                return resolve();
            }
            else if (this._internal.state === 'canceled' && !callback) {
                return reject(new Error(this._internal.cancelReason));
            }
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const noop = () => { };
            this._internal.activatePromises.push({
                resolve,
                reject: callback ? noop : reject, // Don't reject when callback is used: let callback handle this (prevents UnhandledPromiseRejection if only callback is used)
            });
        });
    }
    /** (for internal use) */
    _setActivationState(activated, cancelReason) {
        this._internal.cancelReason = cancelReason;
        this._internal.state = activated ? 'active' : 'canceled';
        while (this._internal.activatePromises.length > 0) {
            const p = this._internal.activatePromises.shift();
            if (activated) {
                p.callback && p.callback(true);
                p.resolve && p.resolve();
            }
            else {
                p.callback && p.callback(false, cancelReason);
                p.reject && p.reject(cancelReason);
            }
        }
    }
}
exports.EventSubscription = EventSubscription;
class EventPublisher {
    /**
     *
     * @param publish function that publishes a new value to subscribers, return if there are any active subscribers
     * @param start function that notifies subscribers their subscription is activated
     * @param cancel function that notifies subscribers their subscription has been canceled, removes all subscriptions
     */
    constructor(publish, start, cancel) {
        this.publish = publish;
        this.start = start;
        this.cancel = cancel;
    }
}
exports.EventPublisher = EventPublisher;
class EventStream {
    constructor(eventPublisherCallback) {
        const subscribers = [];
        let noMoreSubscribersCallback;
        let activationState;
        const _stoppedState = 'stopped (no more subscribers)';
        this.subscribe = (callback, activationCallback) => {
            if (typeof callback !== 'function') {
                throw new TypeError('callback must be a function');
            }
            else if (activationState === _stoppedState) {
                throw new Error('stream can\'t be used anymore because all subscribers were stopped');
            }
            const sub = {
                callback,
                activationCallback: function (activated, cancelReason) {
                    activationCallback && activationCallback(activated, cancelReason);
                    this.subscription._setActivationState(activated, cancelReason);
                },
                subscription: new EventSubscription(function stop() {
                    subscribers.splice(subscribers.indexOf(this), 1);
                    return checkActiveSubscribers();
                }),
            };
            subscribers.push(sub);
            if (typeof activationState !== 'undefined') {
                if (activationState === true) {
                    activationCallback && activationCallback(true);
                    sub.subscription._setActivationState(true);
                }
                else if (typeof activationState === 'string') {
                    activationCallback && activationCallback(false, activationState);
                    sub.subscription._setActivationState(false, activationState);
                }
            }
            return sub.subscription;
        };
        const checkActiveSubscribers = () => {
            let ret;
            if (subscribers.length === 0) {
                ret = noMoreSubscribersCallback && noMoreSubscribersCallback();
                activationState = _stoppedState;
            }
            return Promise.resolve(ret);
        };
        this.unsubscribe = (callback) => {
            const remove = callback
                ? subscribers.filter(sub => sub.callback === callback)
                : subscribers;
            remove.forEach(sub => {
                const i = subscribers.indexOf(sub);
                subscribers.splice(i, 1);
            });
            checkActiveSubscribers();
        };
        this.stop = () => {
            // Stop (remove) all subscriptions
            subscribers.splice(0);
            checkActiveSubscribers();
        };
        /**
         * For publishing side: adds a value that will trigger callbacks to all subscribers
         * @param {any} val
         * @returns {boolean} returns whether there are subscribers left
         */
        const publish = (val) => {
            subscribers.forEach(sub => {
                try {
                    sub.callback(val);
                }
                catch (err) {
                    console.error(`Error running subscriber callback: ${err.message}`);
                }
            });
            if (subscribers.length === 0) {
                checkActiveSubscribers();
            }
            return subscribers.length > 0;
        };
        /**
         * For publishing side: let subscribers know their subscription is activated. Should be called only once
         */
        const start = (allSubscriptionsStoppedCallback) => {
            activationState = true;
            noMoreSubscribersCallback = allSubscriptionsStoppedCallback;
            subscribers.forEach(sub => {
                sub.activationCallback && sub.activationCallback(true);
            });
        };
        /**
         * For publishing side: let subscribers know their subscription has been canceled. Should be called only once
         */
        const cancel = (reason) => {
            activationState = reason;
            subscribers.forEach(sub => {
                sub.activationCallback && sub.activationCallback(false, reason || new Error('unknown reason'));
            });
            subscribers.splice(0); // Clear all
        };
        const publisher = new EventPublisher(publish, start, cancel);
        eventPublisherCallback(publisher);
    }
}
exports.EventStream = EventStream;

},{}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserialize2 = exports.serialize2 = exports.serialize = exports.detectSerializeVersion = exports.deserialize = void 0;
const path_reference_1 = require("./path-reference");
const utils_1 = require("./utils");
const ascii85_1 = require("./ascii85");
const path_info_1 = require("./path-info");
const partial_array_1 = require("./partial-array");
/*
    There are now 2 different serialization methods for transporting values.

    v1:
    The original version (v1) created an object with "map" and "val" properties.
    The "map" property was made optional in v1.14.1 so they won't be present for values needing no serializing

    v2:
    The new version replaces serialized values inline by objects containing ".type" and ".val" properties.
    This serializing method was introduced by `export` and `import` methods because they use streaming and
    are unable to prepare type mappings up-front. This format is smaller in transmission (in many cases),
    and easier to read and process.

    original: { "date": (some date) }
    v1 serialized: { "map": { "date": "date" }, "val": { date: "2022-04-22T07:49:23Z" } }
    v2 serialized: { "date": { ".type": "date", ".val": "2022-04-22T07:49:23Z" } }

    original: (some date)
    v1 serialized: { "map": "date", "val": "2022-04-22T07:49:23Z" }
    v2 serialized: { ".type": "date", ".val": "2022-04-22T07:49:23Z" }
    comment: top level value that need serializing is wrapped in an object with ".type" and ".val". v1 is smaller in this case

    original: 'some string'
    v1 serialized: { "map": {}, "val": "some string" }
    v2 serialized: "some string"
    comment: primitive types such as strings don't need serializing and are returned as is in v2

    original: { "date": (some date), "text": "Some string" }
    v1 serialized: { "map": { "date": "date" }, "val": { date: "2022-04-22T07:49:23Z", "text": "Some string" } }
    v2 serialized: { "date": { ".type": "date", ".val": "2022-04-22T07:49:23Z" }, "text": "Some string" }
*/
/**
 * Original deserialization method using global `map` and `val` properties
 * @param data
 * @returns
 */
const deserialize = (data) => {
    if (data.map === null || typeof data.map === 'undefined') {
        if (typeof data.val === 'undefined') {
            throw new Error('serialized value must have a val property');
        }
        return data.val;
    }
    const deserializeValue = (type, val) => {
        if (type === 'date') {
            // Date was serialized as a string (UTC)
            return new Date(val);
        }
        else if (type === 'binary') {
            // ascii85 encoded binary data
            return ascii85_1.ascii85.decode(val);
        }
        else if (type === 'reference') {
            return new path_reference_1.PathReference(val);
        }
        else if (type === 'regexp') {
            return new RegExp(val.pattern, val.flags);
        }
        else if (type === 'array') {
            return new partial_array_1.PartialArray(val);
        }
        else if (type === 'bigint') {
            return BigInt(val);
        }
        return val;
    };
    if (typeof data.map === 'string') {
        // Single value
        return deserializeValue(data.map, data.val);
    }
    Object.keys(data.map).forEach(path => {
        const type = data.map[path];
        const keys = path_info_1.PathInfo.getPathKeys(path);
        let parent = data;
        let key = 'val';
        let val = data.val;
        keys.forEach(k => {
            key = k;
            parent = val;
            val = val[key]; // If an error occurs here, there's something wrong with the calling code...
        });
        parent[key] = deserializeValue(type, val);
    });
    return data.val;
};
exports.deserialize = deserialize;
/**
 * Function to detect the used serialization method with for the given object
 * @param data
 * @returns
 */
const detectSerializeVersion = (data) => {
    if (typeof data !== 'object' || data === null) {
        // This can only be v2, which allows primitive types to bypass serializing
        return 2;
    }
    if ('map' in data && 'val' in data) {
        return 1;
    }
    else if ('val' in data) {
        // If it's v1, 'val' will be the only key in the object because serialize2 adds ".version": 2 to the object to prevent confusion.
        if (Object.keys(data).length > 1) {
            return 2;
        }
        return 1;
    }
    return 2;
};
exports.detectSerializeVersion = detectSerializeVersion;
/**
 * Original serialization method using global `map` and `val` properties
 * @param data
 * @returns
 */
const serialize = (obj) => {
    var _a;
    // Recursively find dates and binary data
    if (obj === null || typeof obj !== 'object' || obj instanceof Date || obj instanceof ArrayBuffer || obj instanceof path_reference_1.PathReference || obj instanceof RegExp) {
        // Single value
        const ser = (0, exports.serialize)({ value: obj });
        return {
            map: (_a = ser.map) === null || _a === void 0 ? void 0 : _a.value,
            val: ser.val.value,
        };
    }
    obj = (0, utils_1.cloneObject)(obj); // Make sure we don't alter the original object
    const process = (obj, mappings, prefix) => {
        if (obj instanceof partial_array_1.PartialArray) {
            mappings[prefix] = 'array';
        }
        Object.keys(obj).forEach(key => {
            const val = obj[key];
            const path = prefix.length === 0 ? key : `${prefix}/${key}`;
            if (typeof val === 'bigint') {
                obj[key] = val.toString();
                mappings[path] = 'bigint';
            }
            else if (val instanceof Date) {
                // serialize date to UTC string
                obj[key] = val.toISOString();
                mappings[path] = 'date';
            }
            else if (val instanceof ArrayBuffer) {
                // Serialize binary data with ascii85
                obj[key] = ascii85_1.ascii85.encode(val); //ascii85.encode(Buffer.from(val)).toString();
                mappings[path] = 'binary';
            }
            else if (val instanceof path_reference_1.PathReference) {
                obj[key] = val.path;
                mappings[path] = 'reference';
            }
            else if (val instanceof RegExp) {
                // Queries using the 'matches' filter with a regular expression can now also be used on remote db's
                obj[key] = { pattern: val.source, flags: val.flags };
                mappings[path] = 'regexp';
            }
            else if (typeof val === 'object' && val !== null) {
                process(val, mappings, path);
            }
        });
    };
    const mappings = {};
    process(obj, mappings, '');
    const serialized = { val: obj };
    if (Object.keys(mappings).length > 0) {
        serialized.map = mappings;
    }
    return serialized;
};
exports.serialize = serialize;
/**
 * New serialization method using inline `.type` and `.val` properties
 * @param obj
 * @returns
 */
const serialize2 = (obj) => {
    // Recursively find data that needs serializing
    const getSerializedValue = (val) => {
        if (typeof val === 'bigint') {
            // serialize bigint to string
            return {
                '.type': 'bigint',
                '.val': val.toString(),
            };
        }
        else if (val instanceof Date) {
            // serialize date to UTC string
            return {
                '.type': 'date',
                '.val': val.toISOString(),
            };
        }
        else if (val instanceof ArrayBuffer) {
            // Serialize binary data with ascii85
            return {
                '.type': 'binary',
                '.val': ascii85_1.ascii85.encode(val),
            };
        }
        else if (val instanceof path_reference_1.PathReference) {
            return {
                '.type': 'reference',
                '.val': val.path,
            };
        }
        else if (val instanceof RegExp) {
            // Queries using the 'matches' filter with a regular expression can now also be used on remote db's
            return {
                '.type': 'regexp',
                '.val': `/${val.source}/${val.flags}`, // new: shorter
                // '.val': {
                //     pattern: val.source,
                //     flags: val.flags
                // }
            };
        }
        else if (typeof val === 'object' && val !== null) {
            if (val instanceof Array) {
                const copy = [];
                for (let i = 0; i < val.length; i++) {
                    copy[i] = getSerializedValue(val[i]);
                }
                return copy;
            }
            else {
                const copy = {}; //val instanceof Array ? [] : {} as SerializedValueV2;
                if (val instanceof partial_array_1.PartialArray) {
                    // Mark the object as partial ("sparse") array
                    copy['.type'] = 'array';
                }
                for (const prop in val) {
                    copy[prop] = getSerializedValue(val[prop]);
                }
                return copy;
            }
        }
        else {
            // Primitive value. Don't serialize
            return val;
        }
    };
    const serialized = getSerializedValue(obj);
    if (serialized !== null && typeof serialized === 'object' && 'val' in serialized && Object.keys(serialized).length === 1) {
        // acebase-core v1.14.1 made the 'map' property optional.
        // This v2 serialized object might be confused with a v1 without mappings, because it only has a "val" property
        // To prevent this, mark the serialized object with version 2
        serialized['.version'] = 2;
    }
    return serialized;
};
exports.serialize2 = serialize2;
/**
 * New deserialization method using inline `.type` and `.val` properties
 * @param obj
 * @returns
 */
const deserialize2 = (data) => {
    if (typeof data !== 'object' || data === null) {
        // primitive value, not serialized
        return data;
    }
    switch (data['.type']) {
        case undefined: {
            // No type given: this is a plain object or array
            if (data instanceof Array) {
                // Plain array, deserialize items into a copy
                const copy = [];
                const arr = data;
                for (let i = 0; i < arr.length; i++) {
                    copy.push((0, exports.deserialize2)(arr[i]));
                }
                return copy;
            }
            else {
                // Plain object, deserialize properties into a copy
                const copy = {};
                const obj = data;
                for (const prop in obj) {
                    copy[prop] = (0, exports.deserialize2)(obj[prop]);
                }
                return copy;
            }
        }
        case 'bigint': {
            const val = data['.val'];
            return BigInt(val);
        }
        case 'array': {
            // partial ("sparse") array, deserialize children into a copy
            const copy = {};
            for (const index in data) {
                copy[index] = (0, exports.deserialize2)(data[index]);
            }
            delete copy['.type'];
            return new partial_array_1.PartialArray(copy);
        }
        case 'date': {
            // Date was serialized as a string (UTC)
            const val = data['.val'];
            return new Date(val);
        }
        case 'binary': {
            // ascii85 encoded binary data
            const val = data['.val'];
            return ascii85_1.ascii85.decode(val);
        }
        case 'reference': {
            const val = data['.val'];
            return new path_reference_1.PathReference(val);
        }
        case 'regexp': {
            const val = data['.val'];
            if (typeof val === 'string') {
                // serialized as '/(pattern)/flags'
                const match = /^\/(.*)\/([a-z]+)$/.exec(val);
                return new RegExp(match[1], match[2]);
            }
            // serialized as object with pattern & flags properties
            return new RegExp(val.pattern, val.flags);
        }
    }
    throw new Error(`Unknown data type "${data['.type']}" in serialized value`);
};
exports.deserialize2 = deserialize2;

},{"./ascii85":21,"./partial-array":33,"./path-info":34,"./path-reference":35,"./utils":44}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeMappings = void 0;
const utils_1 = require("./utils");
const path_info_1 = require("./path-info");
const data_reference_1 = require("./data-reference");
const data_snapshot_1 = require("./data-snapshot");
/**
 * (for internal use) - gets the mapping set for a specific path
 */
function get(mappings, path) {
    // path points to the mapped (object container) location
    path = path.replace(/^\/|\/$/g, ''); // trim slashes
    const keys = path_info_1.PathInfo.getPathKeys(path);
    const mappedPath = Object.keys(mappings).find(mpath => {
        const mkeys = path_info_1.PathInfo.getPathKeys(mpath);
        if (mkeys.length !== keys.length) {
            return false; // Can't be a match
        }
        return mkeys.every((mkey, index) => {
            if (mkey === '*' || mkey[0] === '$') {
                return true; // wildcard
            }
            return mkey === keys[index];
        });
    });
    const mapping = mappings[mappedPath];
    return mapping;
}
/**
 * (for internal use) - gets the mapping set for a specific path's parent
 */
function map(mappings, path) {
    // path points to the object location, its parent should have the mapping
    const targetPath = path_info_1.PathInfo.get(path).parentPath;
    if (targetPath === null) {
        return;
    }
    return get(mappings, targetPath);
}
/**
 * (for internal use) - gets all mappings set for a specific path and all subnodes
 * @returns returns array of all matched mappings in path
 */
function mapDeep(mappings, entryPath) {
    // returns mapping for this node, and all mappings for nested nodes
    // entryPath: "users/ewout"
    // mappingPath: "users"
    // mappingPath: "users/*/posts"
    entryPath = entryPath.replace(/^\/|\/$/g, ''); // trim slashes
    // Start with current path's parent node
    const pathInfo = path_info_1.PathInfo.get(entryPath);
    const startPath = pathInfo.parentPath;
    const keys = startPath ? path_info_1.PathInfo.getPathKeys(startPath) : [];
    // Every path that starts with startPath, is a match
    // TODO: refactor to return Object.keys(mappings),filter(...)
    const matches = Object.keys(mappings).reduce((m, mpath) => {
        //const mkeys = mpath.length > 0 ? mpath.split("/") : [];
        const mkeys = path_info_1.PathInfo.getPathKeys(mpath);
        if (mkeys.length < keys.length) {
            return m; // Can't be a match
        }
        let isMatch = true;
        if (keys.length === 0 && startPath !== null) {
            // Only match first node's children if mapping pattern is "*" or "$variable"
            isMatch = mkeys.length === 1 && (mkeys[0] === '*' || mkeys[0][0] === '$');
        }
        else {
            mkeys.every((mkey, index) => {
                if (index >= keys.length) {
                    return false; // stop .every loop
                }
                else if (mkey === '*' || mkey[0] === '$' || mkey === keys[index]) {
                    return true; // continue .every loop
                }
                else {
                    isMatch = false;
                    return false; // stop .every loop
                }
            });
        }
        if (isMatch) {
            const mapping = mappings[mpath];
            m.push({ path: mpath, type: mapping });
        }
        return m;
    }, []);
    return matches;
}
/**
 * (for internal use) - serializes or deserializes an object using type mappings
 * @returns returns the (de)serialized value
 */
function process(db, mappings, path, obj, action) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    const keys = path_info_1.PathInfo.getPathKeys(path); // path.length > 0 ? path.split("/") : [];
    const m = mapDeep(mappings, path);
    const changes = [];
    m.sort((a, b) => path_info_1.PathInfo.getPathKeys(a.path).length > path_info_1.PathInfo.getPathKeys(b.path).length ? -1 : 1); // Deepest paths first
    m.forEach(mapping => {
        const mkeys = path_info_1.PathInfo.getPathKeys(mapping.path); //mapping.path.length > 0 ? mapping.path.split("/") : [];
        mkeys.push('*');
        const mTrailKeys = mkeys.slice(keys.length);
        if (mTrailKeys.length === 0) {
            const vars = path_info_1.PathInfo.extractVariables(mapping.path, path);
            const ref = new data_reference_1.DataReference(db, path, vars);
            if (action === 'serialize') {
                // serialize this object
                obj = mapping.type.serialize(obj, ref);
            }
            else if (action === 'deserialize') {
                // deserialize this object
                const snap = new data_snapshot_1.DataSnapshot(ref, obj);
                obj = mapping.type.deserialize(snap);
            }
            return;
        }
        // Find all nested objects at this trail path
        const process = (parentPath, parent, keys) => {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            const key = keys[0];
            let children = [];
            if (key === '*' || key[0] === '$') {
                // Include all children
                if (parent instanceof Array) {
                    children = parent.map((val, index) => ({ key: index, val }));
                }
                else {
                    children = Object.keys(parent).map(k => ({ key: k, val: parent[k] }));
                }
            }
            else {
                // Get the 1 child
                const child = parent[key];
                if (typeof child === 'object') {
                    children.push({ key, val: child });
                }
            }
            children.forEach(child => {
                const childPath = path_info_1.PathInfo.getChildPath(parentPath, child.key);
                const vars = path_info_1.PathInfo.extractVariables(mapping.path, childPath);
                const ref = new data_reference_1.DataReference(db, childPath, vars);
                if (keys.length === 1) {
                    // TODO: this alters the existing object, we must build our own copy!
                    if (action === 'serialize') {
                        // serialize this object
                        changes.push({ parent, key: child.key, original: parent[child.key] });
                        parent[child.key] = mapping.type.serialize(child.val, ref);
                    }
                    else if (action === 'deserialize') {
                        // deserialize this object
                        const snap = new data_snapshot_1.DataSnapshot(ref, child.val);
                        parent[child.key] = mapping.type.deserialize(snap);
                    }
                }
                else {
                    // Dig deeper
                    process(childPath, child.val, keys.slice(1));
                }
            });
        };
        process(path, obj, mTrailKeys);
    });
    if (action === 'serialize') {
        // Clone this serialized object so any types that remained
        // will become plain objects without functions, and we can restore
        // the original object's values if any mappings were processed.
        // This will also prevent circular references
        obj = (0, utils_1.cloneObject)(obj);
        if (changes.length > 0) {
            // Restore the changes made to the original object
            changes.forEach(change => {
                change.parent[change.key] = change.original;
            });
        }
    }
    return obj;
}
const _mappings = Symbol('mappings');
class TypeMappings {
    constructor(db) {
        this.db = db;
        this[_mappings] = {};
    }
    /** (for internal use) */
    get mappings() { return this[_mappings]; }
    /** (for internal use) */
    map(path) {
        return map(this[_mappings], path);
    }
    /**
     * Maps objects that are stored in a specific path to a class, so they can automatically be
     * serialized when stored to, and deserialized (instantiated) when loaded from the database.
     * @param path path to an object container, eg "users" or "users/*\/posts"
     * @param type class to bind all child objects of path to
     * Best practice is to implement 2 methods for instantiation and serializing of your objects:
     * 1) `static create(snap: DataSnapshot)` and 2) `serialize(ref: DataReference)`. See example
     * @param options (optional) You can specify the functions to use to
     * serialize and/or instantiate your class. If you do not specificy a creator (constructor) method,
     * AceBase will call `YourClass.create(snapshot)` method if it exists, or create an instance of
     * YourClass with `new YourClass(snapshot)`.
     * If you do not specifiy a serializer method, AceBase will call `YourClass.prototype.serialize(ref)`
     * if it exists, or tries storing your object's fields unaltered. NOTE: `this` in your creator
     * function will point to `YourClass`, and `this` in your serializer function will point to the
     * `instance` of `YourClass`.
     * @example
     * class User {
     *    static create(snap: DataSnapshot): User {
     *        // Deserialize (instantiate) User from plain database object
     *        let user = new User();
     *        Object.assign(user, snap.val()); // Copy all properties to user
     *        user.id = snap.ref.key; // Add the key as id
     *        return user;
     *    }
     *    serialize(ref: DataReference) {
     *        // Serialize user for database storage
     *        return {
     *            name: this.name
     *            email: this.email
     *        };
     *    }
     * }
     * db.types.bind('users', User); // Automatically uses serialize and static create methods
     */
    bind(path, type, options = {}) {
        // Maps objects that are stored in a specific path to a constructor method,
        // so they are automatically deserialized
        if (typeof path !== 'string') {
            throw new TypeError('path must be a string');
        }
        if (typeof type !== 'function') {
            throw new TypeError('constructor must be a function');
        }
        if (typeof options.serializer === 'undefined') {
            // if (typeof type.prototype.serialize === 'function') {
            //     // Use .serialize instance method
            //     options.serializer = type.prototype.serialize;
            // }
            // Use object's serialize method upon serialization (if available)
        }
        else if (typeof options.serializer === 'string') {
            if (typeof type.prototype[options.serializer] === 'function') {
                options.serializer = type.prototype[options.serializer];
            }
            else {
                throw new TypeError(`${type.name}.prototype.${options.serializer} is not a function, cannot use it as serializer`);
            }
        }
        else if (typeof options.serializer !== 'function') {
            throw new TypeError(`serializer for class ${type.name} must be a function, or the name of a prototype method`);
        }
        if (typeof options.creator === 'undefined') {
            if (typeof type.create === 'function') {
                // Use static .create as creator method
                options.creator = type.create;
            }
        }
        else if (typeof options.creator === 'string') {
            if (typeof type[options.creator] === 'function') {
                options.creator = type[options.creator];
            }
            else {
                throw new TypeError(`${type.name}.${options.creator} is not a function, cannot use it as creator`);
            }
        }
        else if (typeof options.creator !== 'function') {
            throw new TypeError(`creator for class ${type.name} must be a function, or the name of a static method`);
        }
        path = path.replace(/^\/|\/$/g, ''); // trim slashes
        this[_mappings][path] = {
            db: this.db,
            type,
            creator: options.creator,
            serializer: options.serializer,
            deserialize(snap) {
                // run constructor method
                let obj;
                if (this.creator) {
                    obj = this.creator.call(this.type, snap);
                }
                else {
                    obj = new this.type(snap);
                }
                return obj;
            },
            serialize(obj, ref) {
                if (this.serializer) {
                    obj = this.serializer.call(obj, ref, obj);
                }
                else if (obj && typeof obj.serialize === 'function') {
                    obj = obj.serialize(ref, obj);
                }
                return obj;
            },
        };
    }
    /**
     * (for internal use)
     * Serializes any child in given object that has a type mapping
     * @param {string} path | path to the object's location
     * @param {object} obj | object to serialize
     */
    serialize(path, obj) {
        return process(this.db, this[_mappings], path, obj, 'serialize');
    }
    /**
     * (for internal use)
     * Deserialzes any child in given object that has a type mapping
     * @param {string} path | path to the object's location
     * @param {object} obj | object to deserialize
     */
    deserialize(path, obj) {
        return process(this.db, this[_mappings], path, obj, 'deserialize');
    }
}
exports.TypeMappings = TypeMappings;

},{"./data-reference":26,"./data-snapshot":27,"./path-info":34,"./utils":44}],44:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defer = exports.getChildValues = exports.getMutations = exports.compareValues = exports.ObjectDifferences = exports.valuesAreEqual = exports.cloneObject = exports.concatTypedArrays = exports.decodeString = exports.encodeString = exports.bytesToBigint = exports.bigintToBytes = exports.bytesToNumber = exports.numberToBytes = void 0;
const path_reference_1 = require("./path-reference");
const process_1 = require("./process");
const partial_array_1 = require("./partial-array");
function numberToBytes(number) {
    const bytes = new Uint8Array(8);
    const view = new DataView(bytes.buffer);
    view.setFloat64(0, number);
    return new Array(...bytes);
}
exports.numberToBytes = numberToBytes;
function bytesToNumber(bytes) {
    const length = Array.isArray(bytes) ? bytes.length : bytes.byteLength;
    if (length !== 8) {
        throw new TypeError('must be 8 bytes');
    }
    const bin = new Uint8Array(bytes);
    const view = new DataView(bin.buffer);
    const nr = view.getFloat64(0);
    return nr;
}
exports.bytesToNumber = bytesToNumber;
const big = {
    zero: BigInt(0),
    one: BigInt(1),
    two: BigInt(2),
    eight: BigInt(8),
    ff: BigInt(0xff),
};
function bigintToBytes(number) {
    if (typeof number !== 'bigint') {
        throw new Error('number must be a bigint');
    }
    const bytes = [];
    const negative = number < big.zero;
    do {
        const byte = Number(number & big.ff); // NOTE: bits are inverted on negative numbers
        bytes.push(byte);
        number = number >> big.eight;
    } while (number !== (negative ? -big.one : big.zero));
    bytes.reverse(); // little-endian
    if (negative ? bytes[0] < 128 : bytes[0] >= 128) {
        bytes.unshift(negative ? 255 : 0); // extra sign byte needed
    }
    return bytes;
}
exports.bigintToBytes = bigintToBytes;
function bytesToBigint(bytes) {
    const negative = bytes[0] >= 128;
    let number = big.zero;
    for (let b of bytes) {
        if (negative) {
            b = ~b & 0xff;
        } // Invert the bits
        number = (number << big.eight) + BigInt(b);
    }
    if (negative) {
        number = -(number + big.one);
    }
    return number;
}
exports.bytesToBigint = bytesToBigint;
/**
 * Converts a string to a utf-8 encoded Uint8Array
 */
function encodeString(str) {
    if (typeof TextEncoder !== 'undefined') {
        // Modern browsers, Node.js v11.0.0+ (or v8.3.0+ with util.TextEncoder)
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }
    else if (typeof Buffer === 'function') {
        // Node.js
        const buf = Buffer.from(str, 'utf-8');
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    else {
        // Older browsers. Manually encode
        const arr = [];
        for (let i = 0; i < str.length; i++) {
            let code = str.charCodeAt(i);
            if (code > 128) {
                // Attempt simple UTF-8 conversion. See https://en.wikipedia.org/wiki/UTF-8
                if ((code & 0xd800) === 0xd800) {
                    // code starts with 1101 10...: this is a 2-part utf-16 char code
                    const nextCode = str.charCodeAt(i + 1);
                    if ((nextCode & 0xdc00) !== 0xdc00) {
                        // next code must start with 1101 11...
                        throw new Error('follow-up utf-16 character does not start with 0xDC00');
                    }
                    i++;
                    const p1 = code & 0x3ff; // Only use last 10 bits
                    const p2 = nextCode & 0x3ff;
                    // Create code point from these 2: (see https://en.wikipedia.org/wiki/UTF-16)
                    code = 0x10000 | (p1 << 10) | p2;
                }
                if (code < 2048) {
                    // Use 2 bytes for 11 bit value, first byte starts with 110xxxxx (0xc0), 2nd byte with 10xxxxxx (0x80)
                    const b1 = 0xc0 | ((code >> 6) & 0x1f); // 0xc0 = 11000000, 0x1f = 11111
                    const b2 = 0x80 | (code & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    arr.push(b1, b2);
                }
                else if (code < 65536) {
                    // Use 3 bytes for 16-bit value, bits per byte: 4, 6, 6
                    const b1 = 0xe0 | ((code >> 12) & 0xf); // 0xe0 = 11100000, 0xf = 1111
                    const b2 = 0x80 | ((code >> 6) & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    const b3 = 0x80 | (code & 0x3f);
                    arr.push(b1, b2, b3);
                }
                else if (code < 2097152) {
                    // Use 4 bytes for 21-bit value, bits per byte: 3, 6, 6, 6
                    const b1 = 0xf0 | ((code >> 18) & 0x7); // 0xf0 = 11110000, 0x7 = 111
                    const b2 = 0x80 | ((code >> 12) & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    const b3 = 0x80 | ((code >> 6) & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    const b4 = 0x80 | (code & 0x3f);
                    arr.push(b1, b2, b3, b4);
                }
                else {
                    throw new Error(`Cannot convert character ${str.charAt(i)} (code ${code}) to utf-8`);
                }
            }
            else {
                arr.push(code < 128 ? code : 63); // 63 = ?
            }
        }
        return new Uint8Array(arr);
    }
}
exports.encodeString = encodeString;
/**
 * Converts a utf-8 encoded buffer to string
 */
function decodeString(buffer) {
    if (typeof TextDecoder !== 'undefined') {
        // Modern browsers, Node.js v11.0.0+ (or v8.3.0+ with util.TextDecoder)
        const decoder = new TextDecoder();
        if (buffer instanceof Uint8Array) {
            return decoder.decode(buffer);
        }
        const buf = Uint8Array.from(buffer);
        return decoder.decode(buf);
    }
    else if (typeof Buffer === 'function') {
        // Node.js (v10 and below)
        if (buffer instanceof Array) {
            buffer = Uint8Array.from(buffer); // convert to typed array
        }
        if (!(buffer instanceof Buffer) && 'buffer' in buffer && buffer.buffer instanceof ArrayBuffer) {
            const typedArray = buffer;
            buffer = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength); // Convert typed array to node.js Buffer
        }
        if (!(buffer instanceof Buffer)) {
            throw new Error('Unsupported buffer argument');
        }
        return buffer.toString('utf-8');
    }
    else {
        // Older browsers. Manually decode!
        if (!(buffer instanceof Uint8Array) && 'buffer' in buffer && buffer['buffer'] instanceof ArrayBuffer) {
            // Convert TypedArray to Uint8Array
            const typedArray = buffer;
            buffer = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
        }
        if (buffer instanceof Buffer || buffer instanceof Array || buffer instanceof Uint8Array) {
            let str = '';
            for (let i = 0; i < buffer.length; i++) {
                let code = buffer[i];
                if (code > 128) {
                    // Decode Unicode character
                    if ((code & 0xf0) === 0xf0) {
                        // 4 byte char
                        const b1 = code, b2 = buffer[i + 1], b3 = buffer[i + 2], b4 = buffer[i + 3];
                        code = ((b1 & 0x7) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
                        i += 3;
                    }
                    else if ((code & 0xe0) === 0xe0) {
                        // 3 byte char
                        const b1 = code, b2 = buffer[i + 1], b3 = buffer[i + 2];
                        code = ((b1 & 0xf) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
                        i += 2;
                    }
                    else if ((code & 0xc0) === 0xc0) {
                        // 2 byte char
                        const b1 = code, b2 = buffer[i + 1];
                        code = ((b1 & 0x1f) << 6) | (b2 & 0x3f);
                        i++;
                    }
                    else {
                        throw new Error('invalid utf-8 data');
                    }
                }
                if (code >= 65536) {
                    // Split into 2-part utf-16 char codes
                    code ^= 0x10000;
                    const p1 = 0xd800 | (code >> 10);
                    const p2 = 0xdc00 | (code & 0x3ff);
                    str += String.fromCharCode(p1);
                    str += String.fromCharCode(p2);
                }
                else {
                    str += String.fromCharCode(code);
                }
            }
            return str;
        }
        else {
            throw new Error('Unsupported buffer argument');
        }
    }
}
exports.decodeString = decodeString;
function concatTypedArrays(a, b) {
    const c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}
exports.concatTypedArrays = concatTypedArrays;
function cloneObject(original, stack) {
    var _a;
    if (((_a = original === null || original === void 0 ? void 0 : original.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'DataSnapshot') {
        throw new TypeError(`Object to clone is a DataSnapshot (path "${original.ref.path}")`);
    }
    const checkAndFixTypedArray = obj => {
        if (obj !== null && typeof obj === 'object'
            && typeof obj.constructor === 'function' && typeof obj.constructor.name === 'string'
            && ['Buffer', 'Uint8Array', 'Int8Array', 'Uint16Array', 'Int16Array', 'Uint32Array', 'Int32Array', 'BigUint64Array', 'BigInt64Array'].includes(obj.constructor.name)) {
            // FIX for typed array being converted to objects with numeric properties:
            // Convert Buffer or TypedArray to ArrayBuffer
            obj = obj.buffer.slice(obj.byteOffset, obj.byteOffset + obj.byteLength);
        }
        return obj;
    };
    original = checkAndFixTypedArray(original);
    if (typeof original !== 'object' || original === null || original instanceof Date || original instanceof ArrayBuffer || original instanceof path_reference_1.PathReference || original instanceof RegExp) {
        return original;
    }
    const cloneValue = (val) => {
        if (stack.indexOf(val) >= 0) {
            throw new ReferenceError('object contains a circular reference');
        }
        val = checkAndFixTypedArray(val);
        if (val === null || val instanceof Date || val instanceof ArrayBuffer || val instanceof path_reference_1.PathReference || val instanceof RegExp) { // || val instanceof ID
            return val;
        }
        else if (typeof val === 'object') {
            stack.push(val);
            val = cloneObject(val, stack);
            stack.pop();
            return val;
        }
        else {
            return val; // Anything other can just be copied
        }
    };
    if (typeof stack === 'undefined') {
        stack = [original];
    }
    const clone = original instanceof Array ? [] : original instanceof partial_array_1.PartialArray ? new partial_array_1.PartialArray() : {};
    Object.keys(original).forEach(key => {
        const val = original[key];
        if (typeof val === 'function') {
            return; // skip functions
        }
        clone[key] = cloneValue(val);
    });
    return clone;
}
exports.cloneObject = cloneObject;
const isTypedArray = val => typeof val === 'object' && ['ArrayBuffer', 'Buffer', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'Int8Array', 'Int16Array', 'Int32Array'].includes(val.constructor.name);
// CONSIDER: updating isTypedArray to: const isTypedArray = val => typeof val === 'object' && 'buffer' in val && 'byteOffset' in val && 'byteLength' in val;
function valuesAreEqual(val1, val2) {
    if (val1 === val2) {
        return true;
    }
    if (typeof val1 !== typeof val2) {
        return false;
    }
    if (typeof val1 === 'object' || typeof val2 === 'object') {
        if (val1 === null || val2 === null) {
            return false;
        }
        if (val1 instanceof path_reference_1.PathReference || val2 instanceof path_reference_1.PathReference) {
            return val1 instanceof path_reference_1.PathReference && val2 instanceof path_reference_1.PathReference && val1.path === val2.path;
        }
        if (val1 instanceof Date || val2 instanceof Date) {
            return val1 instanceof Date && val2 instanceof Date && val1.getTime() === val2.getTime();
        }
        if (val1 instanceof Array || val2 instanceof Array) {
            return val1 instanceof Array && val2 instanceof Array && val1.length === val2.length && val1.every((item, i) => valuesAreEqual(val1[i], val2[i]));
        }
        if (isTypedArray(val1) || isTypedArray(val2)) {
            if (!isTypedArray(val1) || !isTypedArray(val2) || val1.byteLength === val2.byteLength) {
                return false;
            }
            const typed1 = val1 instanceof ArrayBuffer ? new Uint8Array(val1) : new Uint8Array(val1.buffer, val1.byteOffset, val1.byteLength), typed2 = val2 instanceof ArrayBuffer ? new Uint8Array(val2) : new Uint8Array(val2.buffer, val2.byteOffset, val2.byteLength);
            return typed1.every((val, i) => typed2[i] === val);
        }
        const keys1 = Object.keys(val1), keys2 = Object.keys(val2);
        return keys1.length === keys2.length && keys1.every(key => keys2.includes(key)) && keys1.every(key => valuesAreEqual(val1[key], val2[key]));
    }
    return false;
}
exports.valuesAreEqual = valuesAreEqual;
class ObjectDifferences {
    constructor(added, removed, changed) {
        this.added = added;
        this.removed = removed;
        this.changed = changed;
    }
    forChild(key) {
        if (this.added.includes(key)) {
            return 'added';
        }
        if (this.removed.includes(key)) {
            return 'removed';
        }
        const changed = this.changed.find(ch => ch.key === key);
        return changed ? changed.change : 'identical';
    }
}
exports.ObjectDifferences = ObjectDifferences;
function compareValues(oldVal, newVal, sortedResults = false) {
    const voids = [undefined, null];
    if (oldVal === newVal) {
        return 'identical';
    }
    else if (voids.indexOf(oldVal) >= 0 && voids.indexOf(newVal) < 0) {
        return 'added';
    }
    else if (voids.indexOf(oldVal) < 0 && voids.indexOf(newVal) >= 0) {
        return 'removed';
    }
    else if (typeof oldVal !== typeof newVal) {
        return 'changed';
    }
    else if (isTypedArray(oldVal) || isTypedArray(newVal)) {
        // One or both values are typed arrays.
        if (!isTypedArray(oldVal) || !isTypedArray(newVal)) {
            return 'changed';
        }
        // Both are typed. Compare lengths and byte content of typed arrays
        const typed1 = oldVal instanceof Uint8Array ? oldVal : oldVal instanceof ArrayBuffer ? new Uint8Array(oldVal) : new Uint8Array(oldVal.buffer, oldVal.byteOffset, oldVal.byteLength);
        const typed2 = newVal instanceof Uint8Array ? newVal : newVal instanceof ArrayBuffer ? new Uint8Array(newVal) : new Uint8Array(newVal.buffer, newVal.byteOffset, newVal.byteLength);
        return typed1.byteLength === typed2.byteLength && typed1.every((val, i) => typed2[i] === val) ? 'identical' : 'changed';
    }
    else if (oldVal instanceof Date || newVal instanceof Date) {
        return oldVal instanceof Date && newVal instanceof Date && oldVal.getTime() === newVal.getTime() ? 'identical' : 'changed';
    }
    else if (oldVal instanceof path_reference_1.PathReference || newVal instanceof path_reference_1.PathReference) {
        return oldVal instanceof path_reference_1.PathReference && newVal instanceof path_reference_1.PathReference && oldVal.path === newVal.path ? 'identical' : 'changed';
    }
    else if (typeof oldVal === 'object') {
        // Do key-by-key comparison of objects
        const isArray = oldVal instanceof Array;
        const getKeys = obj => {
            let keys = Object.keys(obj).filter(key => !voids.includes(obj[key]));
            if (isArray) {
                keys = keys.map((v) => parseInt(v));
            }
            return keys;
        };
        const oldKeys = getKeys(oldVal);
        const newKeys = getKeys(newVal);
        const removedKeys = oldKeys.filter(key => !newKeys.includes(key));
        const addedKeys = newKeys.filter(key => !oldKeys.includes(key));
        const changedKeys = newKeys.reduce((changed, key) => {
            if (oldKeys.includes(key)) {
                const val1 = oldVal[key];
                const val2 = newVal[key];
                const c = compareValues(val1, val2);
                if (c !== 'identical') {
                    changed.push({ key, change: c });
                }
            }
            return changed;
        }, []);
        if (addedKeys.length === 0 && removedKeys.length === 0 && changedKeys.length === 0) {
            return 'identical';
        }
        else {
            return new ObjectDifferences(addedKeys, removedKeys, sortedResults ? changedKeys.sort((a, b) => a.key < b.key ? -1 : 1) : changedKeys);
        }
    }
    return 'changed';
}
exports.compareValues = compareValues;
function getMutations(oldVal, newVal, sortedResults = false) {
    const process = (target, compareResult, prev, val) => {
        switch (compareResult) {
            case 'identical': return [];
            case 'changed': return [{ target, prev, val }];
            case 'added': return [{ target, prev: null, val }];
            case 'removed': return [{ target, prev, val: null }];
            default: {
                let changes = [];
                compareResult.added.forEach(key => changes.push({ target: target.concat(key), prev: null, val: val[key] }));
                compareResult.removed.forEach(key => changes.push({ target: target.concat(key), prev: prev[key], val: null }));
                compareResult.changed.forEach(item => {
                    const childChanges = process(target.concat(item.key), item.change, prev[item.key], val[item.key]);
                    changes = changes.concat(childChanges);
                });
                return changes;
            }
        }
    };
    const compareResult = compareValues(oldVal, newVal, sortedResults);
    return process([], compareResult, oldVal, newVal);
}
exports.getMutations = getMutations;
function getChildValues(childKey, oldValue, newValue) {
    oldValue = oldValue === null ? null : oldValue[childKey];
    if (typeof oldValue === 'undefined') {
        oldValue = null;
    }
    newValue = newValue === null ? null : newValue[childKey];
    if (typeof newValue === 'undefined') {
        newValue = null;
    }
    return { oldValue, newValue };
}
exports.getChildValues = getChildValues;
function defer(fn) {
    process_1.default.nextTick(fn);
}
exports.defer = defer;

}).call(this)}).call(this,require("buffer").Buffer)
},{"./partial-array":33,"./path-reference":35,"./process":36,"buffer":16}]},{},[5])(5)
});
