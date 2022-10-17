export declare class AceBaseUser {
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
    settings: {
        [key: string]: string | number | boolean;
    };
    constructor(user: Partial<AceBaseUser>);
}
export declare type AceBaseSignInSuccess = {
    success: true;
    user: AceBaseUser;
    accessToken: string;
    provider: string;
};
export declare type AceBaseSignInFailure = {
    success: false;
    reason: {
        code: string;
        message: string;
    };
};
export declare type AceBaseSignInResult = AceBaseSignInSuccess | AceBaseSignInFailure;
export declare type AceBaseAuthSuccess = {
    success: true;
};
export declare type AceBaseAuthFailure = {
    success: false;
    reason: {
        code: string;
        message: string;
    };
};
export declare type AceBaseAuthResult = AceBaseAuthSuccess | AceBaseAuthFailure;
