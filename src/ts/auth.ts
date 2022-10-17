import { AceBaseUser } from './user';
import type { AceBaseClient } from './acebase-client';

export class AceBaseClientAuth {
    public user: AceBaseUser | null = null;
    public accessToken: string | null = null;

    constructor(private client: AceBaseClient, private eventCallback: (event: string, data: any) => void) {}

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param username A database username
     * @param password The password
     * @returns returns a promise that resolves with the signed in user and access token
     */
    async signIn(username: string, password: string): Promise<{ user: AceBaseUser, accessToken: string }> {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.signIn(username, password);
        if (this.user) { this.eventCallback('signout', { source: 'signin', user: this.user }); }
        this.accessToken = details.accessToken;
        this.user = new AceBaseUser(details.user);
        this.eventCallback('signin', { source: 'signin', user: this.user, accessToken: this.accessToken });
        return { user: this.user, accessToken: this.accessToken };
    }

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param email An email address
     * @param password The password
     * @returns returns a promise that resolves with the signed in user and access token
     */
    async signInWithEmail(email: string, password: string): Promise<{ user: AceBaseUser, accessToken: string }> {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.signInWithEmail(email, password);
        if (this.user) { this.eventCallback('signout', { source: 'email_signin', user: this.user }); }
        this.accessToken = details.accessToken;
        this.user = new AceBaseUser(details.user);
        this.eventCallback('signin', { source: 'email_signin', user: this.user, accessToken: this.accessToken });
        return { user: this.user, accessToken: this.accessToken }; //success: true,
    }

    /**
     * Sign into an account using a previously acquired access token
     * @param accessToken a previously acquired access token
     * @returns returns a promise that resolves with the signed in user and access token. If the token is not right, the thrown `error.code` will be `'not_found'` or `'invalid_token'`
     */
    async signInWithToken(accessToken: string): Promise<{ user: AceBaseUser, accessToken: string }> {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.signInWithToken(accessToken);
        if (this.user) { this.eventCallback('signout', { source: 'token_signin', user: this.user }); }
        this.accessToken = details.accessToken;
        this.user = new AceBaseUser(details.user);
        this.eventCallback('signin', { source: 'token_signin', user: this.user, accessToken: this.accessToken });
        return { user: this.user, accessToken: this.accessToken }; // success: true,
    }

    /**
     * If the client is offline, you can specify an access token to automatically try signing in the user once a connection is made.
     * Doing this is recommended if you are subscribing to event paths that require user authentication/authorization. Subscribing to
     * those server events will then be done after signing in, instead of failing after connecting anonymously.
     * @param accessToken A previously acquired access token
     */
    setAccessToken(accessToken: string) {
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
    async startAuthProviderSignIn(providerName: string, callbackUrl: string, options?: any): Promise<string> {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.startAuthProviderSignIn(providerName, callbackUrl, options);
        return details.redirectUrl;
    }

    /**
     * Use this method to finish OAuth flow from your callbackUrl.
     * @param callbackResult result received in your.callback/url?result
     */
    async finishAuthProviderSignIn(callbackResult: string): Promise<{ user: AceBaseUser, accessToken: string, provider: { name: string, access_token: string, refresh_token: string, expires_in: number } }> {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        const details = await this.client.api.finishAuthProviderSignIn(callbackResult);
        const isOtherUser = !this.user || this.user.uid !== details.user.uid;
        isOtherUser && this.eventCallback('signout', { source: 'oauth_signin', user: this.user });
        this.accessToken = details.accessToken;
        this.user = new AceBaseUser(details.user);
        isOtherUser && this.eventCallback('signin', { source: 'oauth_signin', user: this.user, accessToken: this.accessToken });
        return { user: this.user, accessToken: this.accessToken, provider: details.provider }; // success: true,
    }

    /**
     * Refreshes an expiring access token with the refresh token returned from finishAuthProviderSignIn
     */
    async refreshAuthProviderToken(providerName: string, refreshToken: string) {
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
     */
    async signInWithRedirect(providerName: string) {
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
     * @param options options object, or boolean specifying whether to signout everywhere
     * @returnsreturns a promise that resolves when user was signed out successfully
     */
    async signOut(options: boolean | {
        /**
         * whether to sign out all clients, or only this one
         */
        everywhere?: boolean;

        /**
         * whether to clear the cache database (if used)
         */
        clearCache?: boolean;
    }): Promise<void> {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        else if (!this.user) {
            throw { code: 'not_signed_in', message: 'Not signed in!' };
        }
        if (this.client.connected) {
            await this.client.api.signOut(options);
        }
        this.accessToken = null;
        const user = this.user;
        this.user = null;
        this.eventCallback('signout', { source: 'signout', user });
    }

    /**
     * Changes the password of the currently signed into account
     * @param oldPassword
     * @param newPassword
     * @returns returns a promise that resolves with a new access token
     */
    async changePassword(oldPassword: string, newPassword: string): Promise<{ accessToken: string }> {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        if (!this.user) {
            throw { code: 'not_signed_in', message: 'Not signed in!' };
        }
        const result = await this.client.api.changePassword(this.user.uid, oldPassword, newPassword);
        this.accessToken = result.accessToken;
        this.eventCallback('signin', { source: 'password_change', user: this.user, accessToken: this.accessToken });
        return { accessToken: result.accessToken }; //success: true,
    }

    /**
     * Requests a password reset for the account with specified email address
     * @param email
     * @returns returns a promise that resolves once the request has been processed
     */
    async forgotPassword(email: string): Promise<void> {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        await this.client.api.forgotPassword(email);
    }

    /**
     * Requests a password to be changed using a previously acquired reset code, sent to the email address with forgotPassword
     * @param resetCode
     * @param newPassword
     * @returns returns a promise that resolves once the password has been changed. The user is now able to sign in with the new password
     */
    async resetPassword(resetCode: string, newPassword: string): Promise<void> {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        await this.client.api.resetPassword(resetCode, newPassword);
    }

    /**
     * Verifies an e-mail address using the code sent to the email address upon signing up
     * @param verificationCode
     * @returns returns a promise that resolves when verification was successful
     */
    async verifyEmailAddress(verificationCode: string): Promise<void> {
        if (!this.client.isReady) {
            await this.client.ready();
        }
        await this.client.api.verifyEmailAddress(verificationCode);
    }

    /**
     * Updates one or more user account details
     * @returns returns a promise with the updated user details
     */
    async updateUserDetails(details: {
        /**
         * New username
         */
        username?: string;

        /**
         * New email address
         */
        email?: string;

        /**
         * New display name
         */
        display_name?: string;

        /**
         * New profile picture
         */
        picture?: { url: string; width: number; height: number };

        /**
         * Selection of user settings to update
         */
        settings?: Record<string, boolean | string | number>;
    }) {
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
        if (!this.user) {
            // Signed out in the mean time
            return { user: null };
        }
        for (const key of Object.keys(result.user)) {
            this.user[key as keyof AceBaseUser] = result.user[key];
        }
        return { user: this.user };
    }

    /**
     * Changes the username of the currrently signed into account
     * @returns returns a promise that resolves with the updated user details
     */
    async changeUsername(newUsername: string) {
        return this.updateUserDetails({ username: newUsername });
    }

    /**
     * Changes the display name of the currrently signed into account
     * @param newName
     * @returns returns a promise that resolves with the updated user details
     */
    async changeDisplayName(newName: string) {
        return this.updateUserDetails({ display_name: newName });
    }

    /**
     * Changes the email address of the currrently signed in user
     * @param newEmail
     * @returns returns a promise that resolves with the updated user details
     */
    async changeEmail(newEmail: string) {
        return this.updateUserDetails({ email: newEmail });
    }

    /**
     * Changes the user's profile picture
     * @returns returns a promise that resolves with the updated user details
     */
    async changePicture(newPicture: {
        url: string;
        width: number;
        height: number;
    }) {
        return await this.updateUserDetails({ picture: newPicture });
    }

    /**
     * Updates settings of the currrently signed in user. Passed settings will be merged with the user's current settings
     * @param settings the settings to update
     * @returns returns a promise that resolves with the updated user details
     */
    async updateUserSettings(settings: Record<string, string | number | boolean>) {
        return await this.updateUserDetails({ settings });
    }

    /**
     * Creates a new user account with the given details. If successful, you will automatically be
     * signed into the account. Note: the request will fail if the server has disabled this option
     * @returns returns a promise that resolves with the signed in user and access token
     */
    async signUp(details:
        (
            { username: string; email?: string; }
            | { username?: string; email: string;}
        ) & {
            password: string;
            displayName: string;
            /**
             * optional settings
             */
            settings?: Record<string, string | number | boolean>;
        },
    ): Promise<{ user: AceBaseUser, accessToken?: string }> {
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
            const user = this.user;
            this.user = null;
            this.eventCallback('signout', { source: 'signup', user } );
        }
        const result = await this.client.api.signUp(details, !isAdmin);
        if (isAdmin) {
            return { user: result.user };
        }
        else {
            // Sign into new account
            this.accessToken = result.accessToken;
            this.user = new AceBaseUser(result.user);
            this.eventCallback('signin', { source: 'signup', user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken as string }; //success: true,
        }
    }

    /**
     * Removes the currently signed in user account and signs out. Note: this will only
     * remove the database user account, not any data stored in the database by this user. It is
     * your own responsibility to remove that data.
     * @param uid for admin user only: remove account with specific uid
     */
    async deleteAccount(uid?: string): Promise<void> {
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
            const user = this.user;
            this.user = null;
            this.eventCallback('signout', { source: 'delete_account', user });
        }
    }
}
