export class AceBaseUser {
    constructor(user) {
        Object.assign(this, user);
        if (!user.uid) {
            throw new Error('User details is missing required uid field');
        }
        this.uid = user.uid;
        this.displayName = user.displayName ?? 'unknown';
        this.created = user.created ?? new Date(0);
        this.settings = user.settings ?? {};
    }
}
//# sourceMappingURL=user.js.map