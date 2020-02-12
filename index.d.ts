import * as acebasecore from 'acebase-core';

export interface AceBaseClientConnectionSettings {
    dbname: string
    host: string
    port: number
    https?: boolean
    autoConnect?: boolean
    cache?: { db: acebasecore.AceBaseBase }
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
     * Signs out of the current account
     * @returns {Promise<void>} returns a promise that resolves when user was signed out successfully
     */
    signOut(): Promise<void>;

    /**
     * Changes the password of the currrently signed into account
     * @param {string} oldPassword
     * @param {string} newPassword
     * @returns {Promise<{ accessToken: string }>} returns a promise that resolves with a new access token
     */
    changePassword(oldPassword: string, newPassword: string): Promise<{ accessToken: string }>;

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
     * Removes the currently sign into user account and signs out. Note: this will only
     * remove the database user account, not any data stored in the database by this user. It is
     * your own responsibility to remove that data.
     * @returns {Promise<void>}
     */
    deleteAccount(): Promise<void>

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