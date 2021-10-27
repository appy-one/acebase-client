const { AceBaseBase, DebugLogger, ColorStyle } = require('acebase-core');
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
        this.sync = typeof settings.sync === 'object' ? settings.sync : { timing: 'auto' };
        if (!['connect','signin','auto','manual'].includes(this.sync.timing)) {
            this.sync.timing = 'auto';
        }
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
        super(settings.dbname, { info: 'realtime database client' });

        /*
            TODO: improve init flow with await/async (requires Node 7.6+) 
        */

        const cacheDb = settings.cache && settings.cache.db;
        const cacheReadyPromise = cacheDb ? cacheDb.ready() : Promise.resolve();

        let ready = false;
        this.on('ready', () => { ready = true; });
        this._connected = false;
        this.debug = new DebugLogger(settings.logLevel, `[${settings.dbname}]`.colorize(ColorStyle.blue)); // `[ ${settings.dbname} ]`

        this.on('connect', () => {
            // Disable cache db's ipc events, we are already notified of data changes by the server (prevents double event callbacks)
            if (cacheDb) { cacheDb.settings.ipcEvents = false; }

            // Synchronize date/time
            // const start = Date.now(); // performance.now();
            this.api.getServerInfo()
            .then(info => {
                const now = Date.now(),
                    // roundtrip = now - start, //performance.now() - start,
                    // expectedTime = now - Math.floor(roundtrip / 2),
                    // bias = info.time - expectedTime;
                    bias = info.time - now;
                setServerBias(bias);
            });
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
            if (!this._connected) {
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
            if (settings.sync.timing === 'connect') {
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

        this.api = new WebApi(settings.dbname, { logLevel: settings.logLevel, debug: this.debug, url: `http${settings.https ? 's' : ''}://${settings.host}:${settings.port}`, autoConnect: settings.autoConnect, autoConnectDelay: settings.autoConnectDelay, cache: settings.cache }, (evt, data) => {
        if (evt === 'connect') {
                this._connected = true;
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
                this._connected = false;
                this.emit('disconnect');
            }
        });
        this.auth = new AceBaseClientAuth(this, (event, arg) => {
            this.emit(event, arg);
        });
    }

    get connected() {
        return this._connected;
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
}

module.exports = { AceBaseClient, AceBaseClientConnectionSettings };