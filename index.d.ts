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
     *    will not be updated in cache unless you have change events setup.
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
    connect(): Promise<void>
    disconnect(): void

    /**
     * Calls an extension method that was added to the connected server with the .extend method and returns the result
     * @param method method of your extension
     * @param path path of your extension
     * @param data data to post (put/post methods) or to add to querystring
     */
    callExtension(method:'get'|'put'|'post'|'delete', path: string, data?: any): Promise<any>
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
     * If the server has been configured with OAuth providers, use this to kick off the authentication flow.
     * This method returs a Promise that resolves with the url you have to redirect your user to authenticate 
     * with the requested provider. After the user has authenticated, they will be redirected back to your callbackUrl.
     * Your code in the callbackUrl will have to call finishOAuthProviderSignIn with the result querystring parameter
     * to finish signing in.
     * @param {string} providerName one of the configured providers (eg 'facebook', 'google', 'apple', 'spotify')
     * @param {string} callbackUrl url on your website/app that will receive the sign in result
     * @returns {Promise<string>} returns a Promise that resolves with the url you have to redirect your user to.
     */
    startAuthProviderSignIn(providerName: string, callbackUrl: string): Promise<string>

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
     * Signs out of the current account
     * @param {boolean} everywhere whether to sign out all clients, or only this one
     * @returns {Promise<void>} returns a promise that resolves when user was signed out successfully
     */
    signOut(everywhere?: boolean): Promise<void>;

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
     * Changes the username of the currrently signed into account
     * @param {string} newUsername 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeUsername(newUsername: string): Promise<{ user: AceBaseUser }>

    /**
     * Changes the email address of the currrently signed in user
     * @param {string} newEmail 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeEmail(newEmail: string): Promise<{ user: AceBaseUser }>

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

export import DataSnapshot = acebasecore.DataSnapshot;
export import DataReference = acebasecore.DataReference;
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
export import ID = acebasecore.ID;
export import proxyAccess = acebasecore.proxyAccess;