import { AceBaseBase, LoggingLevel, DebugLogger, ColorStyle, DataSnapshot } from 'acebase-core';
import { WebApi } from './api-web';
import { AceBaseClientAuth } from './auth';
import { setServerBias } from './server-date';

/**
 * Settings to connect to a remote AceBase server
 */
export class AceBaseClientConnectionSettings {

    /**
     * Name of the database you want to access
     */
    dbname: string;

    /**
     * Host name, eg "localhost", or "mydb.domain.com"
     */
    host: string;

    /**
     * Port number the server is running on
     */
    port: number;

    /**
     * Use SSL (https) to access the server or not. Default: `true`
     * @default true
     */
    https = true;

    /**
     * Automatically connect to the server, or wait until `db.connect()` is called
     * @default true
     */
    autoConnect = true;

    /**
     * Delay in ms before auto connecting. Useful for testing scenarios where both server and client start at the same time, and server needs to come online first.
     * @default 0
     */
    autoConnectDelay = 0;

    /**
     * Settings for local cache
     */
    cache: {
        /**
         * AceBase database instance to use for local cache
         */
        db: AceBaseBase | null;
        enabled: boolean;
        priority: 'cache' | 'server';
    };

    /**
     * debug logging level
     */
    logLevel: LoggingLevel = 'log';

    /**
     * Settings for synchronization
     */
    sync: {
        /**
         * Determines when synchronization should execute
         * @default 'auto'
         */
        timing: 'connect' | 'signin' | 'auto' | 'manual';

        /**
         * Whether to enable cursor synchronization if transaction logging is enabled in the server configuration
         * @default true
         */
        useCursor: boolean;
    };

    /**
     * Network settings
     */
    network: {
        /**
         * Whether to actively monitor the network for availability by pinging the server every `interval` seconds.
         * This results in quicker offline detection. Default is `false` if `realtime` is `true` and vice versa
         */
        monitor: boolean;

        /**
         * Interval in seconds to send pings if `monitor` is `true`. Default is `60`
         * @default 60
         */
        interval: number;

        /**
         * Transport methods to try connecting to the server for realtime event notifications (in specified order).
         * Default is `['websocket']`. Supported transport methods are `"websocket"` and `"polling"`.
         * @default ['websocket']
         */
        transports: Array<'websocket'|'polling'>;

        /**
         * Whether to connect to a serverwebsocket to enable realtime event notifications. Default is `true`.
         * Disable this option if you only want to use the server's REST API.
         * @default true
         */
        realtime: boolean;
    };

    /**
     * You can turn this on if you are a sponsor. See https://github.com/appy-one/acebase/discussions/100 for more info
     */
    sponsor: boolean;

    constructor(
        settings: ConnectionSettingsInit,
    ) {
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
            enabled: typeof settings.cache?.db === 'object' && typeof settings.cache?.enabled === 'boolean' ? settings.cache.enabled : false,
            db: typeof settings.cache?.db === 'object' ? settings.cache.db : null,
            priority: typeof settings.cache?.priority === 'string' && ['server','cache'].includes(settings.cache.priority) ? settings.cache.priority : 'server',
        };

        // Set sync settings
        this.sync = {
            timing: typeof settings.sync?.timing === 'string' && ['connect','signin','auto','manual'].includes(settings.sync.timing) ? settings.sync.timing : 'auto',
            useCursor: typeof settings.sync?.useCursor === 'boolean' ? settings.sync.useCursor : true,
        };

        // Set network settings
        const realtime = typeof settings.network?.realtime === 'boolean' ? settings.network.realtime : true;
        this.network = {
            transports: settings.network?.transports instanceof Array ? settings.network.transports : ['websocket'],
            realtime,
            monitor: typeof settings.network?.monitor === 'boolean' ? settings.network.monitor : !realtime,
            interval: typeof settings.network?.interval === 'number' ? settings.network.interval : 60,
        };
    }
}

export type ConnectionSettingsInit = Omit<Partial<AceBaseClientConnectionSettings>, 'dbname' | 'host' | 'port' | 'sync' | 'network' | 'cache'>
& Pick<AceBaseClientConnectionSettings, 'dbname' | 'host' | 'port'>
& {
    sync?: Partial<AceBaseClientConnectionSettings['sync']>;
    network?: Partial<AceBaseClientConnectionSettings['network']>;
    cache?: Partial<AceBaseClientConnectionSettings['cache']>;
};

/**
 * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
 */
export class AceBaseClient extends AceBaseBase {

    /**
     * @internal (for internal use)
     */
    api: WebApi;

    auth: AceBaseClientAuth;

    /**
     * Create a client to access an AceBase server
     */
    constructor(init: ConnectionSettingsInit) {
        if (typeof init !== 'object') {
            // Use old constructor signature: host, port, dbname, https = true
            // eslint-disable-next-line prefer-rest-params
            const [ host, port, dbname, https ] = arguments;
            init = { host, port, dbname, https };
        }
        const settings = init instanceof AceBaseClientConnectionSettings ? init : new AceBaseClientConnectionSettings(init);
        super(settings.dbname, { info: 'realtime database client', sponsor: settings.sponsor });

        /*
            TODO: improve init flow with await/async (requires Node 7.6+)
        */

        const cacheDb = settings.cache?.db;
        const cacheReadyPromise = cacheDb ? cacheDb.ready() : Promise.resolve();

        let ready = false;
        this.on('ready', () => { ready = true; });
        this.debug = new DebugLogger(settings.logLevel, `[${settings.dbname}]`.colorize(ColorStyle.blue)); // `[ ${settings.dbname} ]`

        const synchronizeClocks = async () => {
            // Synchronize date/time
            // const start = Date.now(); // performance.now();
            const info = await this.api.getServerInfo();
            const now = Date.now(),
                // roundtrip = now - start, //performance.now() - start,
                // expectedTime = now - Math.floor(roundtrip / 2),
                // bias = info.time - expectedTime;
                bias = info.time - now;
            setServerBias(bias);
        };

        this.on('connect', () => {
            // Disable cache db's ipc events, we are already notified of data changes by the server (prevents double event callbacks)
            if (cacheDb && 'settings' in (cacheDb as any)) {
                (cacheDb as any).settings.ipcEvents = false;
            }
            synchronizeClocks();
        });

        this.on('disconnect', () => {
            // Enable cache db's ipc events, so we get event notifications of changes by other ipc peers while offline
            if (cacheDb && 'settings' in (cacheDb as any)) {
                (cacheDb as any).settings.ipcEvents = true;
            }
        });

        this.sync = async () => {
            const result = await syncPendingChanges(true);
            return result as Required<Awaited<ReturnType<AceBaseClient['sync']>>>;
        };

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
                    },
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
        };
        let syncTimeout: NodeJS.Timeout;
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

        this.api = new WebApi(settings.dbname, {
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
        this.auth = new AceBaseClientAuth(this, (event, arg) => {
            this.emit(event, arg);
        });
    }

    async sync(): ReturnType<WebApi['sync']> {
        throw new Error('Must be set by constructor');
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

    callExtension(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data: any) {
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
    setCursor(cursor: string) {
        this.api.setSyncCursor(cursor);
    }

    get cache() {
        /**
         * Clears the entire cache, or a specific path without raising any events
         */
        const clear = async (path = '') => {
            await this.api.clearCache(path);
        };

        /**
         * Updates the local cache with remote changes by retrieving all changes to `path` since given `cursor` and applying them to the local cache database.
         * If the local path does not exist or no cursor is given, its entire value will be loaded from the server and stored in cache. If no cache database is used, an error will be thrown.
         * @param path Path to update. The root path will be used if not given, synchronizing the entire database.
         * @param cursor A previously achieved cursor to update with. Path's entire value will be loaded from the server if not given.
         */
        const update = (path = '', cursor: string | null) => {
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
        const get = async (path: string, cursor: string | null): Promise<DataSnapshot> => {
            // Update the cache with provided cursor
            const options = Object.freeze(cursor ? { cache_mode: 'allow', cache_cursor: cursor } : { cache_mode: 'force' });
            const snap = await this.ref(path).get(options);
            return snap;
        };

        return { clear, update, get };
    }
}
