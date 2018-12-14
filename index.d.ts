import * as acebasecore from 'acebase-core';

declare namespace acebaseclient {

    /**
     * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
     */
    class AceBaseClient extends acebasecore.AceBaseBase {
        constructor(host: string, port: number, dbname: string, https?: boolean);

        /**
         * Waits for the database to be ready before running your callback. Do this before performing any other actions on your database
         * @param {()=>void} [callback] (optional) callback function that is called when ready. You can also use the returned promise
         * @returns {Promise<void>} returns a promise that resolves when ready
         */
        ready(callback: () => void): Promise<void>;

        /**
         * Sign into a user account using a username and password. Note that the server must have authentication enabled.
         * @param {string} username Your database username
         * @param {string} password Your password
         * @returns {Promise<AceBaseSignInResult>} returns a promise that resolves with an object
         */
        signIn(username: string, password: string): Promise<AceBaseSignInResult>;

        /**
         * Sign into an account using a previously assigned access token
         * @param {string} accessToken a previously assigned access token
         * @returns {Promise<AceBaseSignInResult>} returns a promise that resolves with an object
         */
        signInWithToken(accessToken: string): Promise<AceBaseSignInResult>;

        /**
         * Signs out of the current account
         * @returns {Promise<AceBaseAuthResult>} returns a promise that resolves with an object
         */
        signOut(): any;

        /**
         * Changes the password of the currrently signed into account
         * @param {string} oldPassword
         * @param {string} newPassword
         * @returns {Promise<AceBaseAuthResult>} returns a promise that resolves with an object
         */
        changePassword(oldPassword: string, newPassword: string): any;

        /**
         * Creates a new user account with the given details. If successful, you will automatically be
         * signed into the account. Note: the request will fail if the server has disabled this option
         * @param {string} username
         * @param {string} password
         * @param {string} displayName
         * @returns {Promise<AceBaseSignInResult>} returns a promise that resolves with an object
         */
        signUp(username: string, password: string, displayName: string): any;

    }

    // /**
    //  * Api to connect to a remote AceBase instance over http
    //  */
    // export class WebApi {
    //     constructor();

    // }

    class AceBaseUser {
        /**
         * @param {object} user
         * @param {string} user.uid
         * @param {string} user.username
         */
        constructor(user: { 
            uid: string, 
            username: string 
        });
    }

    /**
     * @param {object} result
     * @param {boolean} result.success
     * @param {AceBaseUser} [result.user]
     * @param {string} [result.accessToken]
     * @param {string} [result.reason]
     */
    class AceBaseSignInResult {
        constructor(result: {
            success: boolean;
            user?: AceBaseUser;
            accessToken?: string;
            reason?: string;
        });

    }

    /**
     * @param {object} result
     * @param {boolean} result.success
     * @param {string} [result.reason]
     */
    class AceBaseAuthResult {
        constructor(result: {
            success: boolean;
            reason?: string;
        });

    }
}

export = acebaseclient;