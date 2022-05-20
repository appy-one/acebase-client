const { AceBaseBase, DebugLogger, ColorStyle, DataSnapshot } = require('acebase-core');
const { WebApi } = require('./api-web');
const { AceBaseClientAuth } = require('./auth');
const { setServerBias } = require('./server-date');

class AceBaseClientConnectionSettings {

    /**
     * Settings to connect to a remote AceBase server
     * @param {object} settings 
     * @param {string} settings.dbname Name of the database you want to access
     * @param {string} settings.host Host name, eg "localhost", or "mydb.domain.com"
     * @param {number} settings.port Port number the server is running on
     * @param {boolean} [settings.https=true] Use SSL (https) to access the server or not. Default: true
     * @param {boolean} [settings.autoConnect=true] Automatically connect to the server, or wait until .connect is called
     * @param {number} [settings.autoConnectDelay=0] Delay before auto connection. Useful for testing scenarios where both server and client start at the same time, and server needs to come online first.
     * @param {object} [settings.cache] Settings for local cache
     * @param {AceBase} [settings.cache.db] AceBase database instance to use for local cache
     * @param {'verbose'|'log'|'warn'|'error'} [settings.logLevel='log'] debug logging level
     * @param {object} [settings.sync] Settings for synchronization
     * @param {'connect'|'signin'|'auto'|'manual'} [settings.sync.timing] Determines when synchronization should execute
     * @param {boolean} [settings.sync.useCursor] Whether to enable cursor synchronization if transaction logging is enabled in the server configuration
     * @param {object} [settings.network] Network settings
     * @param {boolean} [settings.network.monitor=false] Whether to actively monitor the network for availability by pinging the server every `interval` seconds. This results in quicker offline detection. Default is `false` if `realtime` is `true` and vice versa
     * @param {number} [settings.network.interval=60] Interval in seconds to send pings if `monitor` is `true`. Default is `60`
     * @param {string[]} [settings.network.transports] Transport methods to try connecting to the server for realtime event notifications (in specified order). Default is `['websocket']`. Supported transport methods are `"websocket"` and `"polling"`. 
     * @param {boolean} [settings.network.realtime=true] Whether to connect to a serverwebsocket to enable realtime event notifications. Default is `true`. Disable this option if you only want to use the server's REST API. 
     * @param {boolean} [settings.sponsor=false] You can turn this on if you are a sponsor. See https://github.com/appy-one/acebase/discussions/100 for more info
     */
    constructor(settings) {
        this.dbname = settings.dbname;
        this.host = settings.host;
        this.port = settings.port;
        this.https = typeof settings.https === 'boolean' ? settings.https : true;
        this.autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this.autoConnectDelay = typeof settings.autoConnectDelay === 'number' ? settings.autoConnectDelay : 0;
        this.cache = typeof settings.cache === 'object' && typeof settings.cache.db === 'object' ? settings.cache : null; //  && settings.cache.db.constructor.name.startsWith('AceBase')
        this.logLevel = typeof settings.logLevel === 'string' ? settings.logLevel : 'log';
        this.sponsor = typeof settings.sponsor === 'boolean' ? settings.sponsor : false;
        
        // Set sync settings
        this.sync = settings.sync;
        if (this.sync === null || typeof this.sync !== 'object') { this.sync = {}; }
        if (!['connect','signin','auto','manual'].includes(this.sync.timing)) { this.sync.timing = 'auto'; }
        if (typeof this.sync.useCursor !== 'boolean') { this.sync.useCursor = true; }
        
        // Set network settings
        this.network = settings.network;
        if (this.network === null || typeof this.network !== 'object') { this.network = {}; }
        if (!(this.network.transports instanceof Array)) { this.network.transports = ['websocket'] }
        if (typeof this.network.realtime !== 'boolean') { this.network.realtime = true; }
        if (typeof this.network.monitor !== 'boolean') { this.network.monitor = !this.network.realtime; }
        if (typeof this.network.interval !== 'number') { this.network.interval = 60; }
    }
}

/**
 * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
 * @extends module:acebase-core/AceBaseBase
 */
class AceBaseClient extends AceBaseBase {

    /**
     * Create a client to access an AceBase server
     * @param {AceBaseClientConnectionSettings} settings
     */
    constructor(settings) {
        if (typeof settings !== 'object') {
            // Use old constructor signature: host, port, dbname, https = true
            settings = {};
            settings.host = arguments[0];
            settings.port = arguments[1];
            settings.dbname = arguments[2];
            settings.https = arguments[3];
        }
        if (!(settings instanceof AceBaseClientConnectionSettings)) {
            settings = new AceBaseClientConnectionSettings(settings);
        }
        super(settings.dbname, { info: 'realtime database client', sponsor: settings.sponsor });

        /*
            TODO: improve init flow with await/async (requires Node 7.6+) 
        */

        const cacheDb = settings.cache && settings.cache.db;
        const cacheReadyPromise = cacheDb ? cacheDb.ready() : Promise.resolve();

        let ready = false;
        this.on('ready', () => { ready = true; });
        this.debug = new DebugLogger(settings.logLevel, `[${settings.dbname}]`.colorize(ColorStyle.blue)); // `[ ${settings.dbname} ]`

        const synchronizeClocks = async () => {
            // Synchronize date/time
            // const start = Date.now(); // performance.now();
            const info = await this.api.getServerInfo()
            const now = Date.now(),
                // roundtrip = now - start, //performance.now() - start,
                // expectedTime = now - Math.floor(roundtrip / 2),
                // bias = info.time - expectedTime;
                bias = info.time - now;
            setServerBias(bias);
        };

        this.on('connect', () => {
            // Disable cache db's ipc events, we are already notified of data changes by the server (prevents double event callbacks)
            if (cacheDb) { cacheDb.settings.ipcEvents = false; }
            synchronizeClocks();
        });

        this.on('disconnect', () => {
            // Enable cache db's ipc events, so we get event notifications of changes by other ipc peers while offline
            if (cacheDb) { cacheDb.settings.ipcEvents = true; }
        });

        this.sync = () => {
            return syncPendingChanges(true);
        }
        
        let syncRunning = false, firstSync = true;
        const syncPendingChanges = async (throwErrors = false) => {
            if (syncRunning) { 
                // Already syncing
                if (throwErrors) { throw new Error('sync already running'); }
                return; 
            }
            if (!this.api.isConnected) {
                // We'll retry once connected
                // // Do set firstSync to false, this fixes the issue of the first sync firing after 
                // // an initial succesful connection, but quick disconnect (sync does not run) 
                // // and later reconnect --> Fresh data needs to be loaded
                // firstSync = false; 
                if (throwErrors) { throw new Error('not connected'); }
                return; 
            }
            syncRunning = true;
            try {
                await cacheReadyPromise;
                return await this.api.sync({
                    firstSync,
                    fetchFreshData: !firstSync,
                    eventCallback: (eventName, args) => {
                        this.debug.log(eventName, args || '');
                        this.emit(eventName, args); // this.emit('cache_sync_event', { name: eventName, args });
                    }
                });
            }
            catch(err) {
                // Sync failed for some reason
                if (throwErrors) { throw err; }
                else {
                    console.error(`Failed to synchronize:`, err);
                }
            }
            finally {
                syncRunning = false;
                firstSync = false;
            }
        }
        let syncTimeout = 0;
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
            if (['auto','signin'].includes(settings.sync.timing)) {
                syncPendingChanges();
            }
        });

        const emitClientReady = async () => {
            if (cacheDb) { await cacheDb.ready(); }
            this.emit('ready');
        };

        this.api = new WebApi(settings.dbname, { network: settings.network, sync: settings.sync, logLevel: settings.logLevel, debug: this.debug, url: `http${settings.https ? 's' : ''}://${settings.host}:${settings.port}`, autoConnect: settings.autoConnect, autoConnectDelay: settings.autoConnectDelay, cache: settings.cache }, (evt, data) => {
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
        this.auth = new AceBaseClientAuth(this, (event, arg) => {
            this.emit(event, arg);
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
        return this.api._syncCursor;
    }

    /**
     * Sets the sync cursor to use
     * @param {string} cursor 
     */
    setCursor(cursor) {
        this.api._syncCursor = cursor;
    }

    get cache() {
        /**
         * Clears the entire cache, or a specific path without raising any events
         * @param {string} [path] 
         * @returns 
         */
        const clear = async (path = '') => {
            await this.api.clearCache(path);
        };
        /**
         * Updates the local cache with remote changes by retrieving all changes to `path` since given `cursor` and applying them to the local cache database.
         * If the local path does not exist or no cursor is given, its entire value will be loaded from the server and stored in cache. If no cache database is used, an error will be thrown.
         * @param {string} [path=''] Path to update. The root path will be used if not given, synchronizing the entire database.
         * @param {string|null} [cursor] A previously achieved cursor to update with. Path's entire value will be loaded from the server if not given.
         * @returns {Promise<{ path: string, used_cursor: string, new_cursor: string, loaded_value: boolean, changes: Array<{ path: string, previous: any, value: any, context: any }> }>}
         */
        const update = (path, cursor) => {
            return this.api.updateCache(path, cursor);
        };
        /**
         * Loads a value from cache database.If a cursor is provided, the cache will be updated with remote changes 
         * first. If the value is not available in cache, it will be loaded from the server and stored in cache.
         * This method is a shortcut for common cache logic provided by `db.ref(path).get` with the `cache_mode` 
         * and `cache_cursor` options.
         * @param {string} path target path to load
         * @param {string} [cursor] A previously acquired cursor
         * @returns {Promise<DataSnapshot>} Returns a Promise that resolves with a snapshot of the value
         */
        const get = async (path, cursor) => {
            // Update the cache with provided cursor
            return this.ref(path).get({ cache_mode: cursor ? 'allow' : 'force', cache_cursor: cursor });
        };
        return { clear, update, get };
    }
}

module.exports = { AceBaseClient, AceBaseClientConnectionSettings };