const { AceBaseBase, DebugLogger } = require('acebase-core');
const { WebApi } = require('./api-web');
const { AceBaseClientAuth } = require('./auth');

class AceBaseClientConnectionSettings {

    /**
     * Settings to connect to a remote AceBase server
     * @param {object} settings 
     * @param {string} settings.dbname Name of the database you want to access
     * @param {string} settings.host Host name, eg "localhost", or "mydb.domain.com"
     * @param {number} settings.port Port number the server is running on
     * @param {boolean} [settings.https=true] Use SSL (https) to access the server or not. Default: true
     * @param {boolean} [settings.autoConnect=true] Automatically connect to the server, or wait until .connect is called
     * @param {object} [settings.cache] Settings for local cache
     * @param {AceBase} [settings.cache.db] AceBase database instance to use for local cache
     * @param {'verbose'|'log'|'warn'|'error'} [settings.logLevel='log'] debug logging level
     * 
     */
    constructor(settings) {
        this.dbname = settings.dbname;
        this.host = settings.host;
        this.port = settings.port;
        this.https = typeof settings.https === 'boolean' ? settings.https : true;
        this.autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this.cache = typeof settings.cache === 'object' && typeof settings.cache.db === 'object' ? settings.cache : null; //  && settings.cache.db.constructor.name.startsWith('AceBase')
        this.logLevel = typeof settings.logLevel === 'string' ? settings.logLevel : 'log';
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
        super(settings.dbname, {});
        let ready = false;
        this._connected = false;
        this.debug = new DebugLogger(settings.logLevel, `[${settings.dbname}]`.blue); // `[ ${settings.dbname} ]`

        let syncRunning = false;
        const syncPendingChanges = () => {
            if (syncRunning) { 
                // Already syncing
                return; 
            }
            if (!this._connected) {
                return; // We'll retry once connected
            }
            syncRunning = true;
            return this.api.sync((eventName, args) => {
                this.debug.log(eventName, args || '');
                this.emit(eventName, args); // this.emit('cache_sync_event', { name: eventName, args });
            })
            .catch(err => {
                // Sync failed for some reason
                console.error(`Failed to synchronize:`, err);
            })
            .then(() => {
                syncRunning = false;
            });
        }
        let syncTimeout = 0;
        this.on('connect', () => {
            syncTimeout && clearTimeout(syncTimeout);
            syncTimeout = setTimeout(syncPendingChanges, 1000); // Start sync with a short delay to allow client to sign in first
        });
        this.on('signin', () => {
            syncTimeout && clearTimeout(syncTimeout);
            syncPendingChanges();
        });
        if (settings.cache) {
            const cacheDb = settings.cache.db;
            const remoteConnectPromise = new Promise(resolve => this.once('connect', resolve));
            cacheDb.ready(() => {
                // Cache database is ready. Is remote database ready?
                return promiseTimeout(
                    1000, 
                    remoteConnectPromise, 
                    'remote connection'
                )
                .catch(err => {
                    // If the connect promise timed out, we'll emit the ready event and use the cache.
                    // Any other error should halt execution
                    if (!(err instanceof PromiseTimeoutError)) {
                        this.debug.error(`Error: ${err.message}`);
                        throw err;
                    }
                })
                .then(() => {
                    this.emit('ready');
                });
            });
        }

        this.api = new WebApi(settings.dbname, { logLevel: settings.logLevel, debug: this.debug, url: `http${settings.https ? 's' : ''}://${settings.host}:${settings.port}`, autoConnect: settings.autoConnect, cache: settings.cache }, evt => {
            if (evt === 'connect') {
                this._connected = true;
                this.emit('connect');
                if (!ready) {
                    ready = true;
                    // If no local cache is used, we can emit the ready event now.
                    if (!settings.cache) {
                        this.emit('ready');
                    }
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

    callExtension(method, path, data) {
        return this.api.callExtension(method, path, data);
    }
}

class PromiseTimeoutError extends Error {}
function promiseTimeout(ms, promise, comment) {
    let id;
    if (!promise) { promise = new Promise(() => { /* never resolves */}); }
    let timeout = new Promise((resolve, reject) => {
      id = setTimeout(() => {
        reject(new PromiseTimeoutError(`Promise timed out after ${ms}ms: ${comment}`))
      }, ms)
    })
  
    return Promise.race([
      promise,
      timeout
    ])
    .then((result) => {
      clearTimeout(id)
  
      /**
       * ... we also need to pass the result back
       */
      return result
    })
}

module.exports = { AceBaseClient, AceBaseClientConnectionSettings };