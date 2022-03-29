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
    async signIn(username, password) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.signIn(username, password);
        if (this.user) { this.eventCallback("signout", { source: "signin", user: this.user }); }
        this.accessToken = details.accessToken;
        this.user = new AceBaseUser(details.user);
        this.eventCallback("signin", { source: "signin", user: this.user, accessToken: this.accessToken });
        return { user: this.user, accessToken: this.accessToken };
    }

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} email Your email address
     * @param {string} password Your password
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    async signInWithEmail(email, password) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.signInWithEmail(email, password);
        if (this.user) { this.eventCallback("signout", { source: "email_signin", user: this.user }); }
        this.accessToken = details.accessToken;
        this.user = new AceBaseUser(details.user);
        this.eventCallback("signin", { source: "email_signin", user: this.user, accessToken: this.accessToken });
        return { user: this.user, accessToken: this.accessToken }; //success: true, 
    }

    /**
     * Sign into an account using a previously assigned access token
     * @param {string} accessToken a previously assigned access token
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token. If the token is not right, the thrown `error.code` will be `'not_found'` or `'invalid_token'`
     */
    async signInWithToken(accessToken) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.signInWithToken(accessToken);
        if (this.user) { this.eventCallback("signout", { source: "token_signin", user: this.user }); }
        this.accessToken = details.accessToken;
        this.user = new AceBaseUser(details.user);
        this.eventCallback("signin", { source: "token_signin", user: this.user, accessToken: this.accessToken });
        return { user: this.user, accessToken: this.accessToken }; // success: true, 
    }

    /**
     * If the client is offline, you can specify an access token to automatically try signing in the user once a connection is made. 
     * Doing this is recommended if you are subscribing to event paths that require user authentication/authorization. Subscribing to
     * those server events will then be done after signing in, instead of failing after connecting anonymously.
     * @param {string} accessToken A previously acquired access token
     */
    setAccessToken(accessToken) {
        this.client.api.setAccessToken(accessToken);
    }

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
    async startAuthProviderSignIn(providerName, callbackUrl, options) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.startAuthProviderSignIn(providerName, callbackUrl, options);
        return details.redirectUrl;
    }

    /**
     * Use this method to finish OAuth flow from your callbackUrl.
     * @param {string} callbackResult result received in your.callback/url?result
     * @returns {Promise<{ user: AceBaseUser, accessToken: string, provider: { name: string, access_token: string, refresh_token: string, expires_in: number } }>}
     */
    async finishAuthProviderSignIn(callbackResult) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.finishAuthProviderSignIn(callbackResult);
        const isOtherUser = !this.user || this.user.uid !== details.user.uid;
        isOtherUser && this.eventCallback("signout", { source: "oauth_signin", user: this.user });
        this.accessToken = details.accessToken;
        this.user = new AceBaseUser(details.user);
        isOtherUser && this.eventCallback("signin", { source: "oauth_signin", user: this.user, accessToken: this.accessToken });
        return { user: this.user, accessToken: this.accessToken, provider: details.provider }; // success: true, 
    }

    /**
     * Refreshes an expiring access token with the refresh token returned from finishAuthProviderSignIn
     * @param {string} providerName
     * @param {string} refreshToken 
     * @returns {Promise<{ provider: IAceBaseAuthProviderTokens }}
     */
    async refreshAuthProviderToken(providerName, refreshToken) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.refreshAuthProviderToken(providerName, refreshToken);
        return { provider: details.provider };
    }

    /**
     * Signs in with an external auth provider by redirecting the user to the provider's login page.
     * After signing in, the user will be redirected to the current browser url. Execute
     * getRedirectResult() when your page is loaded again to check if the user was authenticated.
     * @param {string} providerName 
     */
    async signInWithRedirect(providerName) {
        if (typeof window === 'undefined') {
            throw new Error(`signInWithRedirect can only be used within a browser context`);
        }
        const redirectUrl = await this.startAuthProviderSignIn(providerName, window.location.href);
        window.location.href = redirectUrl;
    }

    /** 
     * Checks if the user authentication with an auth provider. 
     */
    async getRedirectResult() {
        if (typeof window === 'undefined') {
            throw new Error(`getRedirectResult can only be used within a browser context`);
        }
        const match = window.location.search.match(/[?&]result=(.*?)(?:&|$)/);
        const callbackResult = match && decodeURIComponent(match[1]);
        if (!callbackResult) {
            return null;
        }
        return await this.finishAuthProviderSignIn(callbackResult);
    }

    /**
     * Signs out of the current account
     * @param {object|boolean} [options] options object, or boolean specifying whether to signout everywhere
     * @param {boolean} [options.everywhere] whether to sign out all clients, or only this one
     * @param {boolean} [options.clearCache] whether to clear the cache database (if used)
     * @returns {Promise<void>} returns a promise that resolves when user was signed out successfully
     */
    async signOut(options) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        else if (!this.user) {
            throw { code: 'not_signed_in', message: 'Not signed in!' };
        }
        if (this.client.isConnected) {
            await this.client.api.signOut(options);
        }
        this.accessToken = null;
        let user = this.user;
        this.user = null;
        this.eventCallback("signout", { source: 'signout', user });
    }

    /**
     * Changes the password of the currrently signed into account
     * @param {string} oldPassword 
     * @param {string} newPassword 
     * @returns {Promise<{ accessToken: string }>} returns a promise that resolves with a new access token
     */
    async changePassword(oldPassword, newPassword) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        else if (!this.user) {
            throw { code: 'not_signed_in', message: 'Not signed in!' };
        }
        const result = await this.client.api.changePassword(this.user.uid, oldPassword, newPassword);
        this.accessToken = result.accessToken;
        this.eventCallback("signin", { source: "password_change", user: this.user, accessToken: this.accessToken });
        return { accessToken: result.accessToken }; //success: true, 
    }

    /**
     * Requests a password reset for the account with specified email address
     * @param {string} email
     * @returns {Promise<void>} returns a promise that resolves once the request has been processed
     */
    async forgotPassword(email) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        return await this.client.api.forgotPassword(email);
    }

    /**
     * Requests a password to be changed using a previously acquired reset code, sent to the email address with forgotPassword
     * @param {string} resetCode
     * @param {string} newPassword
     * @returns {Promise<void>} returns a promise that resolves once the password has been changed. The user is now able to sign in with the new password
     */
    async resetPassword(resetCode, newPassword) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        return await this.client.api.resetPassword(resetCode, newPassword);
    }

    /**
     * Verifies an e-mail address using the code sent to the email address upon signing up
     * @param {string} verificationCode
     * @returns {Promise<void>} returns a promise that resolves when verification was successful
     */
    async verifyEmailAddress(verificationCode) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        return await this.client.api.verifyEmailAddress(verificationCode);
    }

    /**
     * Updates one or more user account details
     * @param {object} details 
     * @param {string} [details.username] New username
     * @param {string} [details.email] New email address
     * @param {string} [details.display_name] New display name
     * @param {{ url: string, width: number, height: number }} [details.picture] New profile picture
     * @param {object} [details.settings] selection of user settings to update
     * @returns returns a promise with the updated user details
     */
    async updateUserDetails(details) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        if (!this.user) {
            throw { code: 'not_signed_in', message: 'Not signed in!' };
        }
        if (typeof details !== 'object') {
            throw { code: 'invalid_details', message: 'details must be an object' };
        }
        const result = await this.client.api.updateUserDetails(details);
        Object.keys(result.user).forEach(key => {
            this.user[key] = result.user[key];
        });
        return { user: this.user }; // success: true
    }

    /**
     * Changes the username of the currrently signed into account
     * @param {string} newUsername 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    async changeUsername(newUsername) {
        return await this.updateUserDetails({ username: newUsername });
    }

    /**
     * Changes the display name of the currrently signed into account
     * @param {string} newName 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    async changeDisplayName(newName) {
        return await this.updateUserDetails({ display_name: newName });
    }

    /**
     * Changes the email address of the currrently signed in user
     * @param {string} newEmail 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    async changeEmail(newEmail) {
        return await this.updateUserDetails({ email: newEmail });
    }

    /**
     * Changes the user's profile picture
     * @param {object} newPicture
     * @param {string} newPicture.url
     * @param {number} newPicture.width
     * @param {number} newPicture.height
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
     async changePicture(newPicture) {
        return await this.updateUserDetails({ picture: newPicture });
    }

    /**
     * Updates settings of the currrently signed in user. Passed settings will be merged with the user's current settings
     * @param {{ [key:string]: string|number|boolean }} settings - the settings to update
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    async updateUserSettings(settings) {
        return await this.updateUserDetails({ settings });
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
    async signUp(details) {
        if (!details.username && !details.email) {
            throw { code: 'invalid_details', message: 'No username or email set' };
        }
        if (!details.password) {
            throw { code: 'invalid_details', message: 'No password given' };
        }
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const isAdmin = this.user && this.user.uid === 'admin';
        if (this.user && !isAdmin) {
            // Sign out of current account
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'signup', user } );
        }
        const result = await this.client.api.signUp(details, !isAdmin);
        if (isAdmin) {
            return { user: result.user };
        }
        else {
            // Sign into new account
            this.accessToken = result.accessToken;
            this.user = new AceBaseUser(result.user);
            this.eventCallback("signin", { source: "signup", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; //success: true, 
        }
    }

    /**
     * Removes the currently signed in user account and signs out. Note: this will only
     * remove the database user account, not any data stored in the database by this user. It is
     * your own responsibility to remove that data.
     * @param {string} [uid] for admin user only: remove account with uid
     * @returns {Promise<void>}
     */
    async deleteAccount(uid) {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        if (!this.user) {
            throw { code: 'not_signed_in', message: 'Not signed in!' };
        }
        if (uid && this.user.uid !== 'admin') {
            throw { code: 'not_admin', message: 'Cannot remove other accounts than signed into account, unless you are admin' };
        }
        const deleteUid = uid || this.user.uid;
        if (deleteUid === 'admin') {
            throw { code: 'not_allowed', message: 'Cannot remove admin user' };
        }
        const signOut = this.user.uid !== 'admin';
        const result = await this.client.api.deleteAccount(deleteUid, signOut);
        if (signOut) {
            // Sign out of the account
            this.accessToken = null;
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'delete_account', user });
        }
    }
}

module.exports = { AceBaseClientAuth };