
class AceBaseUser {
    /**
     * 
     * @param {{ uid: string, username?: string, email?: string, displayName: string, created: Date, last_signin: Date, last_signin_ip: string settings: { [key:string]: string|number|boolean } }} user
     */
    constructor(user) {
        // /** @type {string} unique id */
        // this.uid = user.uid;
        // /** @type {string?} username */
        // this.username = user.username;
        // /** @type {string?} email address */
        // this.email = user.email;
        // /** @type {string?} display or screen name */
        // this.displayName = user.displayName;
        // this.settings = user.settings;
        // this.created = user.created;
        // this.last_signin = user.last_signin;
        // this.last_signin_ip = user.last_signin_ip;
        // this.prev_signin = user.prev_signin;
        // this.prev_signin_ip = user.prev_signin_ip;
        Object.assign(this, user);
    }
}

class AceBaseSignInResult {
    /**
     * 
     * @param {object} result 
     * @param {boolean} result.success
     * @param {AceBaseUser} [result.user]
     * @param {string} [result.accessToken]
     * @param {{ code: string, message: string }} [result.reason]
     */
    constructor(result) {
        this.success = result.success;
        if (result.success) {
            this.user = result.user;
            this.accessToken = result.accessToken;
        }
        else {
            this.reason = result.reason;
        }
    }
}

class AceBaseAuthResult {
    /**
     * 
     * @param {object} result 
     * @param {boolean} result.success
     * @param {{ code: string, message: string }} [result.reason]
     */
    constructor(result) {
        this.success = result.success;
        if (!result.success) {
            this.reason = result.reason;
        }
    }
}

module.exports = { AceBaseUser, AceBaseSignInResult, AceBaseAuthResult };