
export class CachedValueUnavailableError extends Error {
    public serverError?: any;
    constructor(public path: string, message?: string) {
        super(message || `Value for path "/${path}" is not available in cache`);
    }
}
