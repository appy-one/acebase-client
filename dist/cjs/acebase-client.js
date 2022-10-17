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
            enabled: typeof ((_a = settings.cache) === null || _a === void 0 ? void 0 : _a.db) !== 'object' ? false : typeof ((_b = settings.cache) === null || _b === void 0 ? void 0 : _b.enabled) === 'boolean' ? settings.cache.enabled : true,
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
//# sourceMappingURL=acebase-client.js.map