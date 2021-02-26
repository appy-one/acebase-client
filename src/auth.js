const { AceBaseUser, AceBaseSignInResult, AceBaseAuthResult } = require('./user');
// const { AceBaseClient } = require('./acebase-client');

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
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signIn(username, password));
        }
        return this.client.api.signIn(username, password)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; // success: true, 
        });
    }

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} email Your email address
     * @param {string} password Your password
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signInWithEmail(email, password) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signInWithEmail(email, password));
        }
        return this.client.api.signInWithEmail(email, password)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "email_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; //success: true, 
        });
    }

    /**
     * Sign into an account using a previously assigned access token
     * @param {string} accessToken a previously assigned access token
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signInWithToken(accessToken) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signInWithToken(accessToken));
        }
        return this.client.api.signInWithToken(accessToken)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "token_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; // success: true, 
        });
    }

    /**
     * If the server has been configured with Auth providers, use this to kick off the authentication flow.
     * This method returs a Promise that resolves with the url you have to redirect your user to authenticate 
     * with the requested provider. After the user has authenticated, they will be redirected back to your callbackUrl.
     * Your code in the callbackUrl will have to call finishOAuthProviderSignIn with the result querystring parameter
     * to finish signing in.
     * @param {string} providerName one of the configured providers (eg 'facebook', 'google', 'apple', 'spotify')
     * @param {string} callbackUrl url on your website/app that will receive the sign in result
     * @returns {Promise<string>} returns a Promise that resolves with the url you have to redirect your user to.
     */
    startAuthProviderSignIn(providerName, callbackUrl) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.startAuthProviderSignIn(providerName, callbackUrl));
        }
        return this.client.api.startAuthProviderSignIn(providerName, callbackUrl, this.user)
        .then(details => {
            return details.redirectUrl;
        });
    }

    /**
     * Use this method to finish OAuth flow from your callbackUrl.
     * @param {string} callbackResult result received in your.callback/url?result
     * @returns {Promise<{ user: AceBaseUser, accessToken: string, provider: { name: string, access_token: string, refresh_token: string, expires_in: number } }>}
     */
    finishAuthProviderSignIn(callbackResult) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.finishAuthProviderSignIn(callbackResult));
        }
        return this.client.api.finishAuthProviderSignIn(callbackResult)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "oauth_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken, provider: details.provider }; // success: true, 
        });
    }

    /**
     * Refreshes an expiring access token with the refresh token returned from finishAuthProviderSignIn
     * @param {string} providerName
     * @param {string} refreshToken 
     * @returns {Promise<{ provider: IAceBaseAuthProviderTokens }}
     */
    refreshAuthProviderToken(providerName, refreshToken) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.refreshAuthProviderToken(providerName, refreshToken));
        }
        return this.client.api.refreshAuthProviderToken(providerName, refreshToken)
        .then(details => {
            return { provider: details.provider };
        })
    }

    /**
     * Signs in with an external auth provider by redirecting the user to the provider's login page.
     * After signing in, the user will be redirected to the current browser url. Execute
     * getRedirectResult() when your page is loaded again to check if the user was authenticated.
     * @param {string} providerName 
     */
    signInWithRedirect(providerName) {
        if (typeof window === 'undefined') {
            throw new Error(`signInWithRedirect can only be used within a browser context`);
        }
        return this.startAuthProviderSignIn(providerName, window.location.href)
        .then(redirectUrl => {
            window.location.href = redirectUrl;
        });
    }

    /** 
     * Checks if the user authentication with an auth provider. 
     */
    getRedirectResult() {
        if (typeof window === 'undefined') {
            throw new Error(`getRedirectResult can only be used within a browser context`);
        }
        const match = window.location.search.match(/[?&]result=(.*?)(?:&|$)/);
        const callbackResult = match && decodeURIComponent(match[1]);
        if (!callbackResult) {
            return Promise.resolve(null);
        }
        return this.finishAuthProviderSignIn(callbackResult);
    }

    /**
     * Signs out of the current account
     * @param {object|boolean} [options] options object, or boolean specifying whether to signout everywhere
     * @param {boolean} [options.everywhere] whether to sign out all clients, or only this one
     * @param {boolean} [options.clearCache] whether to clear the cache database (if used)
     * @returns {Promise<void>} returns a promise that resolves when user was signed out successfully
     */
    signOut(options) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signOut(options));
        }
        else if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        return this.client.api.signOut(options)
        .then(() => {
            this.accessToken = null;
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'signout', user });
        });
    }

    /**
     * Changes the password of the currrently signed into account
     * @param {string} oldPassword 
     * @param {string} newPassword 
     * @returns {Promise<{ accessToken: string }>} returns a promise that resolves with a new access token
     */
    changePassword(oldPassword, newPassword) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.changePassword(oldPassword, newPassword));
        }
        else if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        return this.client.api.changePassword(this.user.uid, oldPassword, newPassword)
        .then(result => {
            this.accessToken = result.accessToken;
            this.eventCallback("signin", { source: "password_change", user: this.user, accessToken: this.accessToken });
            return { accessToken: result.accessToken }; //success: true, 
        });
    }

    /**
     * Requests a password reset for the account with specified email address
     * @param {string} email
     * @returns {Promise<void>} returns a promise that resolves once the request has been processed
     */
    forgotPassword(email) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.forgotPassword(email));
        }
        return this.client.api.forgotPassword(email);
    }

    /**
     * Requests a password to be changed using a previously acquired reset code, sent to the email address with forgotPassword
     * @param {string} resetCode
     * @param {string} newPassword
     * @returns {Promise<void>} returns a promise that resolves once the password has been changed. The user is now able to sign in with the new password
     */
    resetPassword(resetCode, newPassword) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.resetPassword(resetCode, newPassword));
        }
        return this.client.api.resetPassword(resetCode, newPassword);
    }

    /**
     * Verifies an e-mail address using the code sent to the email address upon signing up
     * @param {string} verificationCode
     * @returns {Promise<void>} returns a promise that resolves when verification was successful
     */
    verifyEmailAddress(verificationCode) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.verifyEmailAddress(verificationCode));
        }
        return this.client.api.verifyEmailAddress(verificationCode);
    }

    _updateUserDetails(details) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this._updateUserDetails(details));
        }
        if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        if (typeof details !== 'object') {
            return Promise.reject({ code: 'invalid_details', message: 'details must be an object' });
        }
        return this.client.api.updateUserDetails(details)
        .then(result => {
            Object.keys(result.user).forEach(key => {
                this.user[key] = result.user[key];
            });
            return { user: this.user }; // success: true
        });
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
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signUp(details));
        }
        const isAdmin = this.user && this.user.uid === 'admin';
        if (this.user && !isAdmin) {
            // Sign out of current account
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'signup', user } );
        }
        return this.client.api.signUp(details, !isAdmin)
        .then(details => {
            if (isAdmin) {
                return { user: details.user };
            }
            else {
                // Sign into new account
                this.accessToken = details.accessToken;
                this.user = new AceBaseUser(details.user);
                this.eventCallback("signin", { source: "signup", user: this.user, accessToken: this.accessToken });
                return { user: this.user, accessToken: this.accessToken }; //success: true, 
            }
        });
    }

    /**
     * Removes the currently signed in user account and signs out. Note: this will only
     * remove the database user account, not any data stored in the database by this user. It is
     * your own responsibility to remove that data.
     * @param {string} [uid] for admin user only: remove account with uid
     * @returns {Promise<void>}
     */
    deleteAccount(uid) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.deleteAccount(uid));
        }
        if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        if (uid && this.user.uid !== 'admin') {
            return Promise.reject({ code: 'not_admin', message: 'Cannot remove other accounts than signed into account, unless you are admin' });
        }
        const deleteUid = uid || this.user.uid;
        if (deleteUid === 'admin') {
            return Promise.reject({ code: 'not_allowed', message: 'Cannot remove admin user' });
        }
        const signOut = this.user.uid !== 'admin';
        return this.client.api.deleteAccount(deleteUid, signOut)
        .then(result => {
            if (signOut) {
                // Sign out of the account
                this.accessToken = null;
                let user = this.user;
                this.user = null;
                this.eventCallback("signout", { source: 'delete_account', user });
            }
        });
    }
}

module.exports = { AceBaseClientAuth };