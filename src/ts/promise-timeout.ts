class PromiseTimeoutError extends Error {}
function promiseTimeout(promise, ms, comment) {
    return new Promise((resolve, reject) => {
        let timeout;
        function success(result) {
            clearTimeout(timeout);
            resolve(result);
        }
        promise.then(success).catch(reject);
        timeout = setTimeout(() => reject(new PromiseTimeoutError(`Promise ${comment ? `"${comment}" ` : ''}timed out after ${ms}ms`)), ms);
    });
}
module.exports = { PromiseTimeoutError, promiseTimeout };