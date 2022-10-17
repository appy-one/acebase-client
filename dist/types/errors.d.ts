export declare class CachedValueUnavailableError extends Error {
    path: string;
    serverError?: any;
    constructor(path: string, message?: string);
}
