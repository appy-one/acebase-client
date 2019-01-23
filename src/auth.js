const { AceBaseUser, AceBaseSignInResult, AceBaseAuthResult } = require('./user');
const { AceBaseClient } = require('./acebase-client');

class AceBaseClientAuth {

    /**
     * 
     * @param {AceBaseClient} client 
     */
    constructor(client, eventCallback) {
        this.client = client;
        this.eventCallback = eventCallback;

        this.user = null;
        this.accessToken = null;
    }

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} username Your database username
     * @param {string} password Your password
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signIn(username, password) {
        /** @type {WebApi} */
        const api = this.client.api;

        this.user = null;
        return api.signIn(username, password)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; // success: true, 
        })
        // .catch(err => {
        //     return { success: false, reason: err };
        // });
    }

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} email Your email address
     * @param {string} password Your password
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signInWithEmail(email, password) {
        /** @type {WebApi} */
        const api = this.client.api;

        this.user = null;
        return api.signInWithEmail(email, password)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "email_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; //success: true, 
        })
        // .catch(err => {
        //     return { success: false, reason: err };
        // });
    }

    /**
     * Sign into an account using a previously assigned access token
     * @param {string} accessToken a previously assigned access token
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signInWithToken(accessToken) {
        /** @type {WebApi} */
        const api = this.client.api;

        this.user = null;
        return api.signInWithToken(accessToken)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "token_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; // success: true, 
        })
        // .catch(err => {
        //     return { success: false, reason: err };
        // });
    }

    /**
     * Signs out of the current account
     * @returns {Promise<void>} returns a promise that resolves when user was signed out successfully
     */
    signOut() {
        if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        /** @type {WebApi} */
        const api = this.client.api;
        return api.signOut()
        .then(() => {
            this.accessToken = null;
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'signout', user });
            // return { success: true };
        })
        // .catch(err => {
        //     return { success: false, reason: err };
        // });
    }

    /**
     * Changes the password of the currrently signed into account
     * @param {string} oldPassword 
     * @param {string} newPassword 
     * @returns {Promise<{ accessToken: string }>} returns a promise that resolves with a new access token
     */
    changePassword(oldPassword, newPassword) {
        if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        /** @type {WebApi} */
        const api = this.client.api;
        return api.changePassword(this.user.uid, oldPassword, newPassword)
        .then(result => {
            this.accessToken = result.accessToken;
            this.eventCallback("signin", { source: "password_change", user: this.user, accessToken: this.accessToken });
            return { accessToken: result.accessToken }; //success: true, 
        })
        // .catch(err => {
        //     return { success: false, reason: err };
        // });
    }

    _updateUserDetails(details) {
        if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        if (typeof details !== 'object') {
            return Promise.reject({ code: 'invalid_details', message: 'details must be an object' });
        }
        /** @type {WebApi} */
        const api = this.client.api;
        return api.updateUserDetails(details)
        .then(result => {
            Object.keys(result.user).forEach(key => {
                this.user[key] = result.user[key];
            });
            return { user: this.user }; // success: true
        })
        // .catch(err => {
        //     return { success: false, reason: err };
        // });
    }

    /**
     * Changes the username of the currrently signed into account
     * @param {string} newUsername 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeUsername(newUsername) {
        return this._updateUserDetails({ username: newUsername });
    }

    /**
     * Changes the email address of the currrently signed in user
     * @param {string} newEmail 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeEmail(newEmail) {
        return this._updateUserDetails({ email: newEmail });
    }

    /**
     * Updates settings of the currrently signed in user. Passed settings will be merged with the user's current settings
     * @param {{ [key:string]: string|number|boolean }} settings - the settings to update
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    updateUserSettings(settings) {
        return this._updateUserDetails({ settings });
    }

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
    signUp(details) {
        if (!details.username && !details.email) {
            return Promise.reject({ code: 'invalid_details', message: 'No username or email set' });
        }
        if (!details.password) {
            return Promise.reject({ code: 'invalid_details', message: 'No password given' });
        }
        /** @type {WebApi} */
        const api = this.client.api;

        if (this.user && this.user.uid !== 'admin') {
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'signup', user } );
        }
        return api.signUp(details)
        .then(details => {
            if (this.user && this.user.uid === 'admin') {
                return { user: details.user };
            }
            else {
                this.accessToken = details.accessToken;
                this.user = new AceBaseUser(details.user);
                this.eventCallback("signin", { source: "signup", user: this.user, accessToken: this.accessToken });
                return { user: this.user, accessToken: this.accessToken }; //success: true, 
            }
        })
        // .catch(err => {
        //     return { success: false, reason: err };
        // });
    }

    /**
     * Removes the currently sign into user account and signs out. Note: this will only
     * remove the database user account, not any data stored in the database by this user. It is
     * your own responsibility to remove that data.
     * @returns {Promise<void>}
     */
    deleteAccount() {
        if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        /** @type {WebApi} */
        const api = this.client.api;
        return api.deleteAccount(this.user.uid)
        .then(result => {
            this.accessToken = null;
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'delete_account', user });
            // return { success: true };
        })
        // .catch(err => {
        //     return { success: false, reason: err };
        // });
    }
}

module.exports = { AceBaseClientAuth };