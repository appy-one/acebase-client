const { AceBase } = require('acebase');
const { WebApi } = require('./api-web');
//const { EventEmitter } = require('events');

class AceBaseClient extends AceBase {

    constructor(host, port, dbname, https = true) {
        super(dbname, { api: { class: WebApi, settings: `http${https ? 's' : ''}://${host}:${port}` } });
        this.user = null;
    }

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

    signUp(username, password, displayName) {
        /** @type {WebApi} */
        const api = this.api;

        this.user = null;
        return api.signUp(username, password, displayName)
        .then(user => {
            this.user = user;
            return { success: true, user };
        })
        .catch(err => {
            return { success: false, reason: err.message };
        });
    }
}

module.exports = { AceBaseClient };