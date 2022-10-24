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
     * User profile picture
     */
    picture?: { width: number, height: number, url: string };

    /**
     * Whether the user's email address has been verified
     */
    emailVerified = false;

    /**
     * Date/time this user record was created (ISO date string)
     */
    created: string;

    /**
     * Date/time this user previously signed in (ISO date string)
     */
    prevSignin?: string;

    /**
     * IP address of previous signin
     */
    prevSigninIp?: string;

    /**
     * Date/time this user last signed in (ISO date string)
     */
    lastSignin?: string;

    /**
     * IP address of last signin
     */
    lastSigninIp?: string;

    /**
     * Whether the user has to change their password
     */
    changePassword = false;

    /**
     * If `changePassword` is true, date/time the password change was requested (ISO date string)
     */
    changePasswordRequested?: string;

    /**
     * If `changePassword` is true, date/time the password must have been changed (ISO date string)
     */
    changePasswordBefore?: string;

    /**
     * Additional saved user settings & info
     */
    settings: { [key:string]: string | number | boolean };

    constructor(user: Partial<AceBaseUser>) {
        Object.assign(this, user);
        if (!user.uid) { throw new Error('User details is missing required uid field'); }
        this.uid = user.uid;
        this.displayName = user.displayName ?? 'unknown';
        this.created = user.created ?? new Date(0).toISOString();
        this.settings = user.settings ?? {};
    }
}
