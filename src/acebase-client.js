const { AceBaseBase } = require('acebase-core');
const { WebApi } = require('./api-web');
const { AceBaseUser, AceBaseSignInResult, AceBaseAuthResult } = require('./user');

/**
 * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
 * @extends module:acebase-core/AceBaseBase
 */
class AceBaseClient extends AceBaseBase {

    /**
     * Create a client to access an AceBase server
     * @param {string} host Host name, eg "localhost", or "mydb.domain.com"
     * @param {number} port Port number the server is running on
     * @param {string} dbname Name of the database you want to access
     * @param {boolean} https Use SSL (https) to access the server or not. Default: true
     */
    constructor(host, port, dbname, https = true) {
        super(dbname, {});
        this.api = new WebApi(dbname, { url: `http${https ? 's' : ''}://${host}:${port}` }, ready => {
            this.emit("ready");
        });
        this.user = null;
    }

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} username Your database username
     * @param {string} password Your password
     * @returns {Promise<AceBaseSignInResult>} returns a promise that resolves with an object
     */
    signIn(username, password) {
        /** @type {WebApi} */
        const api = this.api;

        this.user = null;
        return api.signIn(username, password)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = details.user;
            return { success: true, user: details.user, accessToken: details.accessToken };
        })
        .catch(err => {
            return { success: false, reason: err.message };
        });
    }

    /**
     * Sign into an account using a previously assigned access token
     * @param {string} accessToken a previously assigned access token
     * @returns {Promise<AceBaseSignInResult>} returns a promise that resolves with an object
     */
    signInWithToken(accessToken) {
        /** @type {WebApi} */
        const api = this.api;

        this.user = null;
        return api.signInWithToken(accessToken)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = details.user;
            return { success: true, user: details.user, accessToken: details.accessToken };
        })
        .catch(err => {
            return { success: false, reason: err.message };
        });
    }

    /**
     * Signs out of the current account
     * @returns {Promise<AceBaseAuthResult>} returns a promise that resolves with an object
     * 
     */
    signOut() {
        /** @type {WebApi} */
        const api = this.api;
        return api.signOut()
        .then(() => {
            this.user = null;
            return { success: true };
        })
        .catch(err => {
            return { success: false, reason: err.message };
        });
    }

    /**
     * Changes the password of the currrently signed into account
     * @param {string} oldPassword 
     * @param {string} newPassword 
     * @returns {Promise<AceBaseAuthResult>} returns a promise that resolves with an object
     */
    changePassword(oldPassword, newPassword) {
        /** @type {WebApi} */
        const api = this.api;
        return api.changePassword(this.user.uid, oldPassword, newPassword)
        .then(() => {
            return { success: true };
        })
        .catch(err => {
            return { success: false, reason: err.message };
        });
    }

    /**
     * Creates a new user account with the given details. If successful, you will automatically be 
     * signed into the account. Note: the request will fail if the server has disabled this option
     * @param {string} username 
     * @param {string} password 
     * @param {string} displayName 
     * @returns {Promise<AceBaseSignInResult>} returns a promise that resolves with an object
     */
    signUp(username, password, displayName) {
        /** @type {WebApi} */
        const api = this.api;

        this.user = null;
        return api.signUp(username, password, displayName)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = details.user;
            return { success: true, user: details.user, accessToken: details.accessToken };
        })
        .catch(err => {
            return { success: false, reason: err.message };
        });
    }
}

module.exports = { AceBaseClient };