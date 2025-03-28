export class AceBaseRequestError extends Error {
    get isNetworkError() {
        // 408: Request Timeout, 429: Too Many Requests, 500: Internal Server Error, 502: Bad Gateway, 503: Service Unavailable, 504: Gateway Timeout
        return this.response === null || [408, 429, 500, 502, 503, 504].some((code) => [this.response?.statusCode, this.code].includes(code));
    }
    get isPermissionError() {
        // 401: Unauthorized, 403: Forbidden
        return this.response !== null && ([401, 403]).some((code) => [this.response?.statusCode, this.code].includes(code));
    }
    constructor(public request: any, public response: any, public code?: number | string, public message: string = 'unknown error') {
        super(message);
    }
}
export const NOT_CONNECTED_ERROR_MESSAGE = 'remote database is not connected'; //'AceBaseClient is not connected';
