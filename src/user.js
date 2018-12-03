
class AceBaseUser {
    /**
     * 
     * @param {{ uid: string, username: string }} user
     */
    constructor(user) {
        this.uid = user.uid;
        this.username = user.username;
    }
}

class AceBaseSignInResult {
    /**
     * 
     * @param {object} result 
     * @param {boolean} result.success
     * @param {AceBaseUser} [result.user]
     * @param {string} [result.accessToken]
     * @param {string} [result.reason]
     */
    constructor(result) {
        this.success = result.success;
        if (result.success) {
            this.user = result.success;
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
     * @param {string} [result.reason]
     */
    constructor(result) {
        this.success = result.success;
        if (!result.success) {
            this.reason = result.reason;
        }
    }
}

module.exports = { AceBaseUser, AceBaseSignInResult, AceBaseAuthResult };