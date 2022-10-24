export class PromiseTimeoutError extends Error {}
export function promiseTimeout<T = any>(promise: Promise<T>, ms: number, comment?: string) {
    return new Promise<T>((resolve, reject) => {
        const timeout: NodeJS.Timeout = setTimeout(() => reject(new PromiseTimeoutError(`Promise ${comment ? `"${comment}" ` : ''}timed out after ${ms}ms`)), ms);
        function success(result: T) {
            clearTimeout(timeout);
            resolve(result);
        }
        promise.then(success).catch(reject);
    });
}
