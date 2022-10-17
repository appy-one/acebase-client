"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AceBaseClientAuth = void 0;
const user_1 = require("./user");
class AceBaseClientAuth {
    constructor(client, eventCallback) {
        this.client = client;
        this.eventCallback = eventCallback;
        this.user = null;
        this.accessToken = null;
    }
    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param username A database username
     * @param password The password
     * @returns returns a promise that resolves with the signed in user and access token
     */
    signIn(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.signIn(username, password);
            if (this.user) {
                this.eventCallback('signout', { source: 'signin', user: this.user });
            }
            this.accessToken = details.accessToken;
            this.user = new user_1.AceBaseUser(details.user);
            this.eventCallback('signin', { source: 'signin', user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken };
        });
    }
    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param email An email address
     * @param password The password
     * @returns returns a promise that resolves with the signed in user and access token
     */
    signInWithEmail(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.signInWithEmail(email, password);
            if (this.user) {
                this.eventCallback('signout', { source: 'email_signin', user: this.user });
            }
            this.accessToken = details.accessToken;
            this.user = new user_1.AceBaseUser(details.user);
            this.eventCallback('signin', { source: 'email_signin', user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; //success: true,
        });
    }
    /**
     * Sign into an account using a previously acquired access token
     * @param accessToken a previously acquired access token
     * @returns returns a promise that resolves with the signed in user and access token. If the token is not right, the thrown `error.code` will be `'not_found'` or `'invalid_token'`
     */
    signInWithToken(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.signInWithToken(accessToken);
            if (this.user) {
                this.eventCallback('signout', { source: 'token_signin', user: this.user });
            }
            this.accessToken = details.accessToken;
            this.user = new user_1.AceBaseUser(details.user);
            this.eventCallback('signin', { source: 'token_signin', user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; // success: true,
        });
    }
    /**
     * If the client is offline, you can specify an access token to automatically try signing in the user once a connection is made.
     * Doing this is recommended if you are subscribing to event paths that require user authentication/authorization. Subscribing to
     * those server events will then be done after signing in, instead of failing after connecting anonymously.
     * @param accessToken A previously acquired access token
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
     * @param providerName one of the configured providers (eg 'facebook', 'google', 'apple', 'spotify')
     * @param callbackUrl url on your website/app that will receive the sign in result
     * @param options optional provider specific authentication settings
     * @returns returns a Promise that resolves with the url you have to redirect your user to.
     */
    startAuthProviderSignIn(providerName, callbackUrl, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.startAuthProviderSignIn(providerName, callbackUrl, options);
            return details.redirectUrl;
        });
    }
    /**
     * Use this method to finish OAuth flow from your callbackUrl.
     * @param callbackResult result received in your.callback/url?result
     */
    finishAuthProviderSignIn(callbackResult) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.finishAuthProviderSignIn(callbackResult);
            const isOtherUser = !this.user || this.user.uid !== details.user.uid;
            isOtherUser && this.eventCallback('signout', { source: 'oauth_signin', user: this.user });
            this.accessToken = details.accessToken;
            this.user = new user_1.AceBaseUser(details.user);
            isOtherUser && this.eventCallback('signin', { source: 'oauth_signin', user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken, provider: details.provider }; // success: true,
        });
    }
    /**
     * Refreshes an expiring access token with the refresh token returned from finishAuthProviderSignIn
     */
    refreshAuthProviderToken(providerName, refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const details = yield this.client.api.refreshAuthProviderToken(providerName, refreshToken);
            return { provider: details.provider };
        });
    }
    /**
     * Signs in with an external auth provider by redirecting the user to the provider's login page.
     * After signing in, the user will be redirected to the current browser url. Execute
     * getRedirectResult() when your page is loaded again to check if the user was authenticated.
     */
    signInWithRedirect(providerName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof window === 'undefined') {
                throw new Error(`signInWithRedirect can only be used within a browser context`);
            }
            const redirectUrl = yield this.startAuthProviderSignIn(providerName, window.location.href);
            window.location.href = redirectUrl;
        });
    }
    /**
     * Checks if the user authentication with an auth provider.
     */
    getRedirectResult() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof window === 'undefined') {
                throw new Error(`getRedirectResult can only be used within a browser context`);
            }
            const match = window.location.search.match(/[?&]result=(.*?)(?:&|$)/);
            const callbackResult = match && decodeURIComponent(match[1]);
            if (!callbackResult) {
                return null;
            }
            return yield this.finishAuthProviderSignIn(callbackResult);
        });
    }
    /**
     * Signs out of the current account
     * @param options options object, or boolean specifying whether to signout everywhere
     * @returnsreturns a promise that resolves when user was signed out successfully
     */
    signOut(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            else if (!this.user) {
                throw { code: 'not_signed_in', message: 'Not signed in!' };
            }
            if (this.client.connected) {
                yield this.client.api.signOut(options);
            }
            this.accessToken = null;
            const user = this.user;
            this.user = null;
            this.eventCallback('signout', { source: 'signout', user });
        });
    }
    /**
     * Changes the password of the currently signed into account
     * @param oldPassword
     * @param newPassword
     * @returns returns a promise that resolves with a new access token
     */
    changePassword(oldPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            if (!this.user) {
                throw { code: 'not_signed_in', message: 'Not signed in!' };
            }
            const result = yield this.client.api.changePassword(this.user.uid, oldPassword, newPassword);
            this.accessToken = result.accessToken;
            this.eventCallback('signin', { source: 'password_change', user: this.user, accessToken: this.accessToken });
            return { accessToken: result.accessToken }; //success: true,
        });
    }
    /**
     * Requests a password reset for the account with specified email address
     * @param email
     * @returns returns a promise that resolves once the request has been processed
     */
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            yield this.client.api.forgotPassword(email);
        });
    }
    /**
     * Requests a password to be changed using a previously acquired reset code, sent to the email address with forgotPassword
     * @param resetCode
     * @param newPassword
     * @returns returns a promise that resolves once the password has been changed. The user is now able to sign in with the new password
     */
    resetPassword(resetCode, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            yield this.client.api.resetPassword(resetCode, newPassword);
        });
    }
    /**
     * Verifies an e-mail address using the code sent to the email address upon signing up
     * @param verificationCode
     * @returns returns a promise that resolves when verification was successful
     */
    verifyEmailAddress(verificationCode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            yield this.client.api.verifyEmailAddress(verificationCode);
        });
    }
    /**
     * Updates one or more user account details
     * @returns returns a promise with the updated user details
     */
    updateUserDetails(details) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            if (!this.user) {
                throw { code: 'not_signed_in', message: 'Not signed in!' };
            }
            if (typeof details !== 'object') {
                throw { code: 'invalid_details', message: 'details must be an object' };
            }
            const result = yield this.client.api.updateUserDetails(details);
            if (!this.user) {
                // Signed out in the mean time
                return { user: null };
            }
            for (const key of Object.keys(result.user)) {
                this.user[key] = result.user[key];
            }
            return { user: this.user };
        });
    }
    /**
     * Changes the username of the currrently signed into account
     * @returns returns a promise that resolves with the updated user details
     */
    changeUsername(newUsername) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateUserDetails({ username: newUsername });
        });
    }
    /**
     * Changes the display name of the currrently signed into account
     * @param newName
     * @returns returns a promise that resolves with the updated user details
     */
    changeDisplayName(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateUserDetails({ display_name: newName });
        });
    }
    /**
     * Changes the email address of the currrently signed in user
     * @param newEmail
     * @returns returns a promise that resolves with the updated user details
     */
    changeEmail(newEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateUserDetails({ email: newEmail });
        });
    }
    /**
     * Changes the user's profile picture
     * @returns returns a promise that resolves with the updated user details
     */
    changePicture(newPicture) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateUserDetails({ picture: newPicture });
        });
    }
    /**
     * Updates settings of the currrently signed in user. Passed settings will be merged with the user's current settings
     * @param settings the settings to update
     * @returns returns a promise that resolves with the updated user details
     */
    updateUserSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateUserDetails({ settings });
        });
    }
    /**
     * Creates a new user account with the given details. If successful, you will automatically be
     * signed into the account. Note: the request will fail if the server has disabled this option
     * @returns returns a promise that resolves with the signed in user and access token
     */
    signUp(details) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!details.username && !details.email) {
                throw { code: 'invalid_details', message: 'No username or email set' };
            }
            if (!details.password) {
                throw { code: 'invalid_details', message: 'No password given' };
            }
            if (!this.client.isReady) {
                yield this.client.ready();
            }
            const isAdmin = this.user && this.user.uid === 'admin';
            if (this.user && !isAdmin) {
                // Sign out of current account
                const user = this.user;
                this.user = null;
                this.eventCallback('signout', { source: 'signup', user });
            }
            const result = yield this.client.api.signUp(details, !isAdmin);
            if (isAdmin) {
                return { user: result.user };
            }
            else {
                // Sign into new account
                this.accessToken = result.accessToken;
                this.user = new user_1.AceBaseUser(result.user);
                this.eventCallback('signin', { source: 'signup', user: this.user, accessToken: this.accessToken });
                return { user: this.user, accessToken: this.accessToken }; //success: true,
            }
        });
    }
    /**
     * Removes the currently signed in user account and signs out. Note: this will only
     * remove the database user account, not any data stored in the database by this user. It is
     * your own responsibility to remove that data.
     * @param uid for admin user only: remove account with specific uid
     */
    deleteAccount(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.isReady) {
                yield this.client.ready();
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
            const result = yield this.client.api.deleteAccount(deleteUid, signOut);
            if (signOut) {
                // Sign out of the account
                this.accessToken = null;
                const user = this.user;
                this.user = null;
                this.eventCallback('signout', { source: 'delete_account', user });
            }
        });
    }
}
exports.AceBaseClientAuth = AceBaseClientAuth;
//# sourceMappingURL=auth.js.map