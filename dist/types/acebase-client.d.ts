import { AceBaseBase, LoggingLevel, DataSnapshot } from 'acebase-core';
import { WebApi } from './api-web';
import { AceBaseClientAuth } from './auth';
/**
 * Settings to connect to a remote AceBase server
 */
export declare class AceBaseClientConnectionSettings {
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
    https: boolean;
    /**
     * Automatically connect to the server, or wait until `db.connect()` is called
     * @default true
     */
    autoConnect: boolean;
    /**
     * Delay in ms before auto connecting. Useful for testing scenarios where both server and client start at the same time, and server needs to come online first.
     * @default 0
     */
    autoConnectDelay: number;
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
    logLevel: LoggingLevel;
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
        transports: Array<'websocket' | 'polling'>;
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
    constructor(settings: ConnectionSettingsInit);
}
export declare type ConnectionSettingsInit = Omit<Partial<AceBaseClientConnectionSettings>, 'dbname' | 'host' | 'port' | 'sync' | 'network' | 'cache'> & Pick<AceBaseClientConnectionSettings, 'dbname' | 'host' | 'port'> & {
    sync?: Partial<AceBaseClientConnectionSettings['sync']>;
    network?: Partial<AceBaseClientConnectionSettings['network']>;
    cache?: Partial<AceBaseClientConnectionSettings['cache']>;
};
/**
 * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
 */
export declare class AceBaseClient extends AceBaseBase {
    /**
     * @internal (for internal use)
     */
    api: WebApi;
    auth: AceBaseClientAuth;
    /**
     * Create a client to access an AceBase server
     */
    constructor(init: ConnectionSettingsInit);
    sync(): ReturnType<WebApi['sync']>;
    get connected(): boolean;
    get connectionState(): "disconnected" | "connecting" | "connected" | "disconnecting";
    connect(): Promise<void>;
    disconnect(): void;
    close(): void;
    callExtension(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data: any): Promise<any>;
    /**
     * Gets the current sync cursor
     */
    getCursor(): string | null;
    /**
     * Sets the sync cursor to use
     */
    setCursor(cursor: string): void;
    get cache(): {
        clear: (path?: string) => Promise<void>;
        update: (path: string | undefined, cursor: string | null) => Promise<{
            path: string;
            used_cursor: string | null;
            new_cursor: string;
            loaded_value: boolean;
            changes: {
                path: string;
                previous: any;
                value: any;
                context: any;
            }[];
        }>;
        get: (path: string, cursor: string | null) => Promise<DataSnapshot>;
    };
}
