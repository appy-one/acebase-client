class PromiseTimeoutError extends Error {}
function promiseTimeout(promise, ms, comment) {
    let id;
    const timeout = new Promise(resolve => {
        id = setTimeout(() => {
            resolve(new PromiseTimeoutError(`Promise timed out after ${ms}ms: ${comment}`))
        }, ms);
    });
  
    return Promise.race([
        promise,
        timeout
    ])
    .then(result => {
        if (result instanceof PromiseTimeoutError) {
            throw result;
        }
        clearTimeout(id);
        return result;
    });
}
module.exports = { PromiseTimeoutError, promiseTimeout };