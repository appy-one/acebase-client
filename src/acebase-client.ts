import { AceBaseBase, LoggingLevel, DebugLogger, ColorStyle, DataSnapshot } from 'acebase-core';
import { HttpMethod, WebApi } from './api-web';
import { AceBaseClientAuth } from './auth';
import { setServerBias } from './server-date';

/**
 * Settings to connect to a remote AceBase server
 * @internal (for internal use only)
 */
export class ConnectionSettings {

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
     * Root path of the AceBase server instance. Specify this if the server's `rootPath` has been configured.
     * @default ''
     */
    rootPath = '';

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
         * AceBase database to use as local cache. Any data loaded from the server is
         * automatically cached and become available offline. Any changes you make will
         * update both the server and the cache. When offline, all changes will be
         * synchronized with the server upon reconnect.
         */
        db: AceBaseBase | null;

        /**
         * Whether to use cache or not. This value can not be changed while running.
         * @default true
         */
        enabled: boolean;

        /**
         * Which database to use as primary target for getting and updating data.
         *
         * Using `'server'` (default) is recommended.
         *
         * Using `'cache'` will be faster, but has some disadvantages:
         * - When getting values, cache is not updated with server data so any remote changes
         *    will not be updated in cache unless you have change events setup, or fetch fresh
         *    data manually.
         * - When storing values, you won't know if the server update failed.
         *
         * Summary: use `'server'` unless you know what you're doing.
         * @default 'server'
         */
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
         * Determines when synchronization should execute:
         *
         * - after `"connect"` event
         * - after `"signin"` event
         * - `"manual"` with `client.sync()`, or
         * - `"auto"`, which is 2.5s after `"connect"` event, or immediately after `"signin"` event. (legacy, default behaviour)
         *
         * If your app needs to sync data that is only accessible to the signed in user, set this
         * to `"signin"`. If not, set this to `"connect"`. The `"auto"` setting is default and provided
         * for backward compatibility, but should only be used if you have no other option. If you want to manually
         * trigger synchronization with `client.sync()`, set this to `"manual"`
         * @default 'auto'
         */
        timing: 'connect' | 'signin' | 'auto' | 'manual';

        /**
         * Specifies whether to use cursor synchronization if transaction logging is enabled in the server configuration.
         * Synchronization with a cursor is faster and consumes (a lot) less bandwidth
         * @default true
         */
        useCursor: boolean;
    };

    /**
     * Network settings
     */
    network: {
        /**
         * Whether to actively monitor the network, checks connectivity with the server every `interval` seconds.
         * NOTE: disconnects to the server are discovered automatically under normal circumstances,
         * enabling this might cause disconnects to be detected earlier.
         *
         * Default is `false` if `realtime` is `true` (default) and vice versa
         */
        monitor: boolean;

        /**
         * Perform connectivity check every `interval` seconds if `monitor` is `true`. Default is `60`
         * @default 60
         */
        interval: number;

        /**
         * Transport methods to try connecting to the server for realtime event notifications (in specified order).
         * Default is `['websocket']` because websockets are now widely supported. Supported transport methods are
         * `"websocket"` and `"polling"`. Older versions of acebase-client used `['polling','websocket']`.
         * @default ['websocket']
         */
        transports: Array<'websocket'|'polling'>;

        /**
         * Whether to connect to a server websocket to enable realtime event notifications. Default is `true`.
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
        settings: AceBaseClientConnectionSettings,
    ) {
        this.dbname = settings.dbname;
        this.host = settings.host;
        this.port = settings.port;
        this.https = typeof settings.https === 'boolean' ? settings.https : true;
        if (typeof settings.rootPath === 'string') { this.rootPath = settings.rootPath.replace(/^\/|\/$/g, ''); }
        this.autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this.autoConnectDelay = typeof settings.autoConnectDelay === 'number' ? settings.autoConnectDelay : 0;
        this.logLevel = typeof settings.logLevel === 'string' ? settings.logLevel : 'log';
        this.sponsor = typeof settings.sponsor === 'boolean' ? settings.sponsor : false;

        // Set cache settings
        this.cache = {
            enabled: typeof settings.cache?.db !== 'object' ? false : typeof settings.cache?.enabled === 'boolean' ? settings.cache.enabled : true,
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

/**
 * Settings to connect to a remote AceBase server
 */
export type AceBaseClientConnectionSettings = Omit<Partial<ConnectionSettings>, 'dbname' | 'host' | 'port' | 'sync' | 'network' | 'cache'>
& Pick<ConnectionSettings, 'dbname' | 'host' | 'port'>
& {
    sync?: Partial<ConnectionSettings['sync']>;
    network?: Partial<ConnectionSettings['network']>;
    cache?: Partial<ConnectionSettings['cache']>;
};

/**
 * Cache settings to enable offline access and synchronization
 */
export type AceBaseClientCacheSettings = AceBaseClientConnectionSettings['cache'];

/**
 * Settings for synchronization between server and cache databases
 */
export type AceBaseClientSyncSettings = AceBaseClientConnectionSettings['sync'];

/**
 * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
 */
export class AceBaseClient extends AceBaseBase {

    /**
     * @internal (for internal use)
     */
    api: WebApi;

    /**
     * User authentication methods
     */
    auth: AceBaseClientAuth;

    /**
     * Create a client to access an AceBase server
     */
    constructor(init: AceBaseClientConnectionSettings) {
        if (typeof init !== 'object') {
            // Use old constructor signature: host, port, dbname, https = true
            // eslint-disable-next-line prefer-rest-params
            const [ host, port, dbname, https ] = arguments;
            init = { host, port, dbname, https };
        }
        const settings = new ConnectionSettings(init); // init instanceof ConnectionSettings ? init : new ConnectionSettings(init);
        super(settings.dbname, { info: 'realtime database client', sponsor: settings.sponsor });

        /*
            TODO: improve init flow with await/async (requires Node 7.6+)
        */

        const cacheDb = settings.cache.enabled && settings.cache.db;
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

        if (typeof process === 'object' && typeof process?.on === 'function') {
            // Enable graceful process exits, fixes #32
            process.on('SIGINT', () => {
                if (this.connected) {
                    this.debug.log('Received SIGINT, closing connection');
                    this.disconnect(); // Should be enough to exit process
                }
            });
        }

        this.api = new WebApi(settings.dbname, {
            network: settings.network,
            sync: settings.sync,
            logLevel: settings.logLevel,
            autoConnect: settings.autoConnect,
            autoConnectDelay: settings.autoConnectDelay,
            cache: settings.cache,
            debug: this.debug,
            url: `http${settings.https ? 's' : ''}://${settings.host}:${settings.port}`,
            rootPath: settings.rootPath,
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

    /**
     * Initiates manual synchronization with the server of any paths with active event subscriptions. Use this if you have set the `sync.timing` connection setting to 'manual'
     */
    async sync(): ReturnType<WebApi['sync']> {
        throw new Error('Must be set by constructor');
    }

    /**
     * Whether the client is connected to the server
     */
    get connected() {
        return this.api.isConnected;
    }

    /**
     * Current connection state
     */
    get connectionState() {
        return this.api.connectionState;
    }

    /**
     * Manually connects to the server: use this if you have `autoConnect` disabled in your client config
     * @param retry Whether to keep retrying to connect if the connection fails. Default is `true`
     */
    connect(retry = true) {
        return this.api.connect(retry);
    }

    /**
     * Disconnects from the server
     */
    disconnect() {
        this.api.disconnect();
    }

    /**
     * Disconnects from the server
     */
    close() {
        this.disconnect();
    }

    /**
     * Calls an extension method that was added to the connected server with the .extend method and returns the result
     * @param method method of your extension
     * @param path path of your extension
     * @param data data to post (put/post methods) or to add to querystring
     */
    callExtension(method: HttpMethod | Uppercase<HttpMethod>, path: string, data?: any) {
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

    /**
     * Cache specific operations
     */
    get cache() {
        /**
         * Clears the entire cache, or a specific path without raising any events
         */
        const clear = async (path = '') => {
            await this.api.clearCache(path);
        };

        /**
         * Updates the local cache with remote changes by retrieving all mutations to `path` since given `cursor` and applying them to the local cache database.
         * If the local path does not exist or no cursor is given, its entire value will be loaded from the server and stored in cache. If no cache database is used, an error will be thrown.
         * All relevant event listeners will be triggered upon data changes.
         * @param path Path to update. The root path will be used if not given, synchronizing the entire database.
         * @param cursor A previously acquired cursor to update the cache with. If not specified or null, `path`'s entire value will be loaded from the server.
         */
        const update = (path = '', cursor: string | null = null) => {
            return this.api.updateCache(path, cursor);
        };

        /**
         * Loads a value from cache database. If a cursor is provided, the cache will be updated with remote changes
         * first. If the value is not available in cache, it will be loaded from the server and stored in cache.
         * This method is a shortcut for common cache logic provided by `db.ref(path).get` with the `cache_mode`
         * and `cache_cursor` options.
         * @param path target path to load
         * @param cursor A previously acquired cursor
         * @returns Returns a Promise that resolves with a snapshot of the value
         */
        const get = async (path: string, cursor: string | null = null): Promise<DataSnapshot> => {
            // Update the cache with provided cursor
            const options = Object.freeze(cursor ? { cache_mode: 'allow', cache_cursor: cursor } : { cache_mode: 'force' });
            const snap = await this.ref(path).get(options);
            return snap;
        };

        return { clear, update, get };
    }
}
