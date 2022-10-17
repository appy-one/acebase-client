export class AceBaseUser {
    /**
     * unique id
     */
    uid: string;

    /**
     * username used for signing in
     */
    username?: string;

    /**
     * email address used for signing in
     */
    email?: string;

    /**
     * display or screen name
     */
    displayName: string;

    /**
     * Date/time this user record was created
     */
    created: Date;

    /**
     * Date/time this user previously signed in
     */
    last_signin?: Date;

    /**
     * IP address of last signin
     */
    last_signin_ip?: string;

    /**
     * Additional saved user settings & info
     */
    settings: { [key:string]: string|number|boolean };

    constructor(user: Partial<AceBaseUser>) {
        Object.assign(this, user);
        if (!user.uid) { throw new Error('User details is missing required uid field'); }
        this.uid = user.uid;
        this.displayName = user.displayName ?? 'unknown';
        this.created = user.created ?? new Date(0);
        this.settings = user.settings ?? {};
    }
}

export type AceBaseSignInSuccess = { success: true; user: AceBaseUser; accessToken: string; provider: string };
export type AceBaseSignInFailure = { success: false; reason: { code: string, message: string }; };
export type AceBaseSignInResult = AceBaseSignInSuccess | AceBaseSignInFailure;
// export class AceBaseSignInResult {
//     success: boolean;
//     user?: AceBaseUser;
//     accessToken?: string;
//     reason?: { code: string, message: string };
//     constructor(result: { success: boolean; user?: AceBaseUser; accessToken?: string; reason?: { code: string, message: string } }) {
//         this.success = result.success;
//         if (result.success) {
//             this.user = result.user;
//             this.accessToken = result.accessToken;
//         }
//         else {
//             this.reason = result.reason;
//         }
//     }
// }

export type AceBaseAuthSuccess = { success: true };
export type AceBaseAuthFailure = { success: false; reason: { code: string, message: string } };
export type AceBaseAuthResult = AceBaseAuthSuccess | AceBaseAuthFailure;

// export class AceBaseAuthResult {
//     success: boolean;
//     reason?: { code: string, message: string };
//     constructor(result: { success: boolean; reason?: { code: string, message: string }}) {
//         this.success = result.success;
//         if (!result.success) {
//             this.reason = result.reason;
//         }
//     }
// }
