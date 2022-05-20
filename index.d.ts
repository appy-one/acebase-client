import * as acebasecore from 'acebase-core';

export interface AceBaseClientCacheSettings {
    /**
     * AceBase database to use as local cache. Any data loaded from the server is 
     * automatically cached and become available offline. Any changes you make will
     * update both the server and the cache. When offline, all changes will be 
     * synchronized with the server upon reconnect.
     */
    db: acebasecore.AceBaseBase,
    /**
     * Which database to use as primary target for getting and updating data. 
     * 
     * Using 'server' (default) is recommended.
     *  
     * Using 'cache' will be faster, but has some disadvantages: 
     * - When getting values, cache is not updated with server data so any remote changes 
     *    will not be updated in cache unless you have change events setup, or fetch fresh 
     *    data manually.
     * - When storing values, you won't know if the server update failed.
     * 
     * Summary: use 'server' unless you know what you're doing.
     * @default 'server'
     */
    priority?: 'cache'|'server',
    /**
     * Whether to use cache or not. This value can not be changed while running.
     * @default true
     */
    enabled?: boolean
}
export interface AceBaseClientSyncSettings {
    /**
     * Determines when synchronization should execute: 
     * 
     * - after `"connect"` event
     * - after `"signin"` event
     * - `"manual"` with `client.sync()`, or 
     * - `"auto"`, which is 2.5s after `"connect"` event, or immediately after `"signin"` event. (legacy behaviour)
     * 
     * If your app needs to sync data that is only accessible to the signed in user, set this 
     * to `"signin"`. If not, set this to `"connect"`. The `"auto"` setting is default and provided 
     * for backward compatibility, but should not be used anymore. If you want to manually
     * trigger synchronization with `client.sync()`, set this to `"manual"`
     * @default 'auto'
     */
    timing?: 'connect'|'signin'|'auto'|'manual';

    /**
     * Specifies whether to use cursor synchronization if transaction logging is enabled in the server configuration. 
     * Synchronization with a cursor is faster and consumes (a lot) less bandwidth
     * @default true
     */
    useCursor?: boolean;
}
export interface AceBaseClientConnectionSettings {
    dbname: string
    host: string
    port: number
    /**
     * @default true
     */
    https?: boolean
    /**
     * Whether to connect to the server right away. When set to false, you will have to execute db.connect() manually
     * @default true
     */
    autoConnect?: boolean
    /**
     * Optional cache settings to enable offline access and synchronization
     */
    cache?: AceBaseClientCacheSettings
    /**
     * Level of console output logging. It is recommended to set to 'warn' or 'error' for production
     * @default 'log'
     */
    logLevel?: 'verbose'|'log'|'warn'|'error'
    /**
     * Settings for synchronization
     */
    sync?: AceBaseClientSyncSettings
    /**
     * Network monitoring settings
     */
    network?: {
        /**
         * Whether to actively monitor the network, checks connectivity with the server every `interval` seconds. 
         * NOTE: disconnects to the server are discovered automatically under normal circumstances, 
         * enabling this might cause disconnects to be detected earlier.
         * 
         * Default is `false` if `realtime` is `true` (default) and vice versa
         */
        monitor?: boolean
        /**
         * Perform conncetivity check every `interval` seconds. 
         * @default 60
         */
        interval?: number
        /**
         * Allows the transport methods and order for socket.io (engine.io) to be changed. Default of acebase-client v1.10.1+ is `['websocket']`, older versions use `['polling','websocket']`
         */
        transports?: Array<'polling'|'websocket'>
        /**
         * Whether to connect to a serverwebsocket to enable realtime event notifications. 
         * Default is `true`. Disable this option if you only want to use the server's REST API.
         */
        realtime?: boolean
    }
    /** You can turn this on if you are a sponsor. See https://github.com/appy-one/acebase/discussions/100 for more info */
    sponsor?: boolean
}

/**
 * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
 */
export class AceBaseClient extends acebasecore.AceBaseBase {
    constructor(settings: AceBaseClientConnectionSettings);
    /**
     * DEPRECATED: Use new AceBaseClient(settings: AceBaseClientConnectionSettings) constructor
     * @deprecated use new constructor
     */
    constructor(host: string, port: number, dbname: string, https?: boolean);
    readonly auth: AceBaseClientAuth
    readonly connected: boolean
    readonly connectionState: 'disconnected'|'connecting'|'connected'|'disconnecting';

    /**
     * Connects to the server
     */
    connect(): Promise<void>

    /**
     * Disconnects from the server
     */
    disconnect(): void

    /**
     * Disconnects from the server
     */
    close(): Promise<void>

    /**
     * Calls an extension method that was added to the connected server with the .extend method and returns the result
     * @param method method of your extension
     * @param path path of your extension
     * @param data data to post (put/post methods) or to add to querystring
     */
    callExtension(method:'get'|'put'|'post'|'delete', path: string, data?: any): Promise<any>

    /**
     * Initiates manual synchronization with the server of any paths with active event subscriptions. Use this if you have set the `sync.timing` connection setting to 'manual'
     */
    sync(): Promise<void>
    
    readonly cache: {
        /**
         * Clears the entire cache, or a specific path without raising any events
         * @param path 
         */
        clear(path?: string): Promise<void>

        /**
         * Updates the local cache with remote changes by retrieving all mutations to `path` since given `cursor` and applying them to the local cache database.
         * If the local path does not exist or no cursor is given, its entire value will be loaded from the server and stored in cache. If no cache database is used, an error will be thrown.
         * All relevant event listeners will be raised upon data changes.
         * @param path Path to update. The root path will be used if not given, synchronizing the entire database.
         * @param cursor A previously acquired cursor to update the cache with. If not specified or null, `path`'s entire value will be loaded from the server.
         */
        update(path?: string, cursor?: string|null): Promise<{ path: string, used_cursor: string, new_cursor: string, loaded_value: boolean, changes: Array<{ path: string, previous: any, value: any, context: any }> }>

        /**
         * Loads a value from cache database.If a cursor is provided, the cache will be updated with remote changes 
         * first. If the value is not available in cache, it will be loaded from the server and stored in cache.
         * This method is a shortcut for common cache logic provided by `db.ref(path).get` with the `cache_mode` 
         * and `cache_cursor` options.
         * @param path target path to load
         * @param cursor A previously acquired cursor
         * @returns Returns a Promise that resolves with a snapshot of the value
         */
         get(path: string, cursor?: string): Promise<DataSnapshot>        
    }

}

export interface IAceBaseAuthProviderSignInResult { 
    user: AceBaseUser, 
    accessToken: string, 
    provider: IAceBaseAuthProviderTokens 
}
export interface IAceBaseAuthProviderTokens { 
    name: string, 
    access_token: string, 
    refresh_token: string, 
    expires_in: number 
}
export class AceBaseClientAuth {
    user?: AceBaseUser
    accessToken: string

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} username database username
     * @param {string} password password
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signIn(username: string, password: string): Promise<{ user: AceBaseUser, accessToken: string }>;

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} email email address
     * @param {string} password password
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signInWithEmail(email: string, password: string): Promise<{ user: AceBaseUser, accessToken: string }>;

    /**
     * Sign into an account using a previously assigned access token
     * @param {string} accessToken a previously assigned access token
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signInWithToken(accessToken: string): Promise<{ user: AceBaseUser, accessToken: string }>;

    /**
     * If the client is offline, you can specify an access token to automatically try signing in the user once a connection is made. 
     * Doing this is recommended if you are subscribing to event paths that require user authentication/authorization. Subscribing to
     * those server events will then be done after signing in, instead of failing after connecting anonymously.
     * @param accessToken A previously acquired access token
     */
    setAccessToken(accessToken: string): void

    /**
     * If the server has been configured with OAuth providers, use this to kick off the authentication flow.
     * This method returs a Promise that resolves with the url you have to redirect your user to authenticate 
     * with the requested provider. After the user has authenticated, they will be redirected back to your callbackUrl.
     * Your code in the callbackUrl will have to call finishOAuthProviderSignIn with the result querystring parameter
     * to finish signing in.
     * @param {string} providerName one of the configured providers (eg 'facebook', 'google', 'apple', 'spotify')
     * @param {string} callbackUrl url on your website/app that will receive the sign in result
     * @param {any} [options] optional provider specific authentication settings
     * @returns {Promise<string>} returns a Promise that resolves with the url you have to redirect your user to.
     */
    startAuthProviderSignIn(providerName: string, callbackUrl: string, options?: any): Promise<string>

    /**
     * Use this method to finish OAuth flow from your callbackUrl.
     * @param {string} callbackResult result received in your.callback/url?result
     */
    finishAuthProviderSignIn(callbackResult): Promise<IAceBaseAuthProviderSignInResult>

    /**
     * Refreshes an expiring access token with the refresh token returned from finishAuthProviderSignIn
     * @param {string} providerName
     * @param {string} refreshToken
     */
    refreshAuthProviderToken(providerName: string, refreshToken: string): Promise<{ provider: IAceBaseAuthProviderTokens }>

    /**
     * Signs in with an external auth provider by redirecting the user to the provider's login page.
     * After signing in, the user will be redirected to the current browser url. Execute
     * getRedirectResult() when your page is loaded again to check if the user was authenticated.
     * @param {string} providerName 
     */
    signInWithRedirect(providerName: string): void;

    /** 
     * Checks if the user authentication with an auth provider. 
     */
    getRedirectResult(): Promise<IAceBaseAuthProviderSignInResult>;

    // TODO:
    // signInWithPopup(providerName: string): Promise<IAceBaseAuthProviderSignInResult>;

    /**
     * When using a cache db, removes all or specific cached data
     * @param path (optional) specific path to remove
     */
    clearCache(path?: string): Promise<void>

    /**
     * Signs out of the current account
     * @returns {Promise<void>} returns a promise that resolves when user was signed out successfully
     */
    signOut(): Promise<void>;
    /**
     * @param {boolean} everywhere whether to sign out all clients, or only this one
     */
    signOut(everywhere: boolean): Promise<void>;
    /** 
     * @param {any} options
     * @param {boolean} [options.everywhere=false] whether to sign out all clients, or only this one
     * @param {boolean} [options.clearCache=false] if cache database is used: whether to clear cached data (recommended, currently not enabled by default, might change in next major version)
     */
    signOut(options: { everywhere?: boolean, clearCache?: boolean }): Promise<void>;

    /**
     * Changes the password of the currrently signed into account
     * @param {string} oldPassword
     * @param {string} newPassword
     * @returns {Promise<{ accessToken: string }>} returns a promise that resolves with a new access token
     */
    changePassword(oldPassword: string, newPassword: string): Promise<{ accessToken: string }>;

    /**
     * Requests a password reset for the account with specified email address
     * @param {string} email
     * @returns returns a promise that resolves once the request has been processed
     */
    forgotPassword(email: string): Promise<void>;
    
    /**
     * Requests a password to be changed using a previously acquired reset code, sent to the email address with forgotPassword
     * @param {string} resetCode
     * @param {string} newPassword
     * @returns returns a promise that resolves once the password has been changed. The user is now able to sign in with the new password
     */
    resetPassword(resetCode, newPassword): Promise<void>;

    /**
     * Creates a new user account with the given details. If successful, you will automatically be
     * signed into the account. Note: the request will fail if the server has disabled this option
     * @param {object} details
     * @param {string} [details.username] 
     * @param {string} [details.email] 
     * @param {string} details.password
     * @param {string} details.displayName
     * @param {{ [key:string]: string|number|boolean }} [details.settings] optional settings 
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signUp(details: { username?: string, email?: string, password: string, displayName: string, settings?: { [key:string]: string|number|boolean } }): Promise<{ user: AceBaseUser, accessToken: string }>;
    
    /**
     * Verifies an e-mail address using the code sent to the email address upon signing up
     * @param {string} verificationCode
     * @returns {Promise<void>} returns a promise that resolves when verification was successful
     */
    verifyEmailAddress(verificationCode): Promise<void>

    /**
     * Updates one or more user account details
     * @param details selection of user details to update
     * @returns returns a promise with the updated user details
     */
    updateUserDetails(details: Partial<{ username: string, email: string, display_name: string, picture: { url: string, width: number, height: number }, settings: { [key: string]: string|number|boolean } }>): Promise<{ user: AceBaseUser }>

    /**
     * Changes the username of the currrently signed into account
     * @param {string} newUsername 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeUsername(newUsername: string): Promise<{ user: AceBaseUser }>

    /**
     * Changes the display name of the currrently signed into account
     * @param {string} newName 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeDisplayName(newName: string): Promise<{ user: AceBaseUser }>

    /**
     * Changes the email address of the currrently signed in user
     * @param {string} newEmail 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeEmail(newEmail: string): Promise<{ user: AceBaseUser }>

    /**
     * Changes the user's profile picture
     * @returns returns a promise that resolves with the updated user details
     */    
    changePicture(newPicture: { url: string, width: number, height: number }): Promise<{ user: AceBaseUser }>

    /**
     * Updates settings of the currrently signed in user. Passed settings will be merged with the user's current settings
     * @param {{ [key:string]: string|bumber|boolean }} settings - the settings to update
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    updateUserSettings(settings: { [key:string]: string|number|boolean }): Promise<{ user: AceBaseUser }>

    /**
     * Removes the currently signed in user account and signs out. Note: this will only
     * remove the database user account, not any data stored in the database by this user. It is
     * your own responsibility to remove that data.
     * @param uid for admin user only: remove account with uid
     * @returns {Promise<void>}
     */
    deleteAccount(uid?: string): Promise<void>

}

export class AceBaseUser {
    uid: string
    username?: string
    email?: string
    displayName?: string
    settings: { [key:string]: string|number|boolean }
    created: string //Date
    createdIp: string
    lastSignin: string //Date
    lastSigninIp: string
    prevSignin?: string //Date
    prevSigninIp?: string
    changePassword?: boolean
    changePasswordRequested?: string
    changePasswordBefore?: string //Date
    picture?: { width: number, height: number, url }

    constructor(user: AceBaseUser);
}

// export class AceBaseSignInResult {
//     success: boolean;
//     user?: AceBaseUser;
//     accessToken?: string;
//     reason?: string;

//     /**
//      * @param {object} result
//      * @param {boolean} result.success
//      * @param {AceBaseUser} [result.user]
//      * @param {string} [result.accessToken]
//      * @param {string} [result.reason]
//      */
//     constructor(result: {
//         success: boolean;
//         user?: AceBaseUser;
//         accessToken?: string;
//         reason?: string;
//     });
// }

// export class AceBaseAuthResult {
//     success: boolean;
//     reason?: string;

//     /**
//      * @param {object} result
//      * @param {boolean} result.success
//      * @param {string} [result.reason]
//      */
//     constructor(result: {
//         success: boolean;
//         reason?: string;
//     });
// }

export class ServerDate extends Date {}
export class CachedValueUnavailableError extends Error {
    path: string
}

export import DataSnapshot = acebasecore.DataSnapshot;
export import DataReference = acebasecore.DataReference;
export import DataSnapshotsArray = acebasecore.DataSnapshotsArray;
export import DataReferencesArray = acebasecore.DataReferencesArray;
export import EventStream = acebasecore.EventStream;
export import EventSubscription = acebasecore.EventSubscription;
export import PathReference = acebasecore.PathReference;
export import TypeMappings = acebasecore.TypeMappings;
export import TypeMappingOptions = acebasecore.TypeMappingOptions;
export import IReflectionNodeInfo = acebasecore.IReflectionNodeInfo;
export import IReflectionChildrenInfo = acebasecore.IReflectionChildrenInfo;
export import IStreamLike = acebasecore.IStreamLike;
export import ILiveDataProxy = acebasecore.ILiveDataProxy;
export import ILiveDataProxyValue = acebasecore.ILiveDataProxyValue;
export import IObjectCollection = acebasecore.IObjectCollection;
export import ObjectCollection = acebasecore.ObjectCollection;
export import ID = acebasecore.ID;
export import proxyAccess = acebasecore.proxyAccess;
export import PartialArray = acebasecore.PartialArray;