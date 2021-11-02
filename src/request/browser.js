const { AceBaseRequestError } = require('./error');

/**
 * @returns {Promise<{ context: any, data: any }>} returns a promise that resolves with an object containing data and an optionally returned context
 */
async function request(method, url, options = { accessToken: null, data: null, dataReceivedCallback: null, context: null }) {
    let postData = options.data;
    if (typeof postData === 'undefined' || postData === null) {
        postData = '';
    }
    else if (typeof postData === 'object') {
        postData = JSON.stringify(postData);
    }
    const headers = {
        'AceBase-Context': JSON.stringify(options.context || null),
        'Content-Type': 'application/json',
    };
    const init = {
        method,
        headers
    };
    if (postData.length > 0) {
        init.body = postData;
    }
    if (options.accessToken) {
        headers['Authorization'] = `Bearer ${options.accessToken}`;
    }
    const request = { url, method, headers };
    const res = await fetch(request.url, init).catch(err => {
        console.error(err);
        throw err;
    });
    let data = '';
    if (typeof options.dataReceivedCallback === 'function') {
        // Stream response
        const reader = res.body.getReader();
        await new Promise((resolve, reject) => {
            (function readNext() {
                reader.read()
                .then(result => {
                    options.dataReceivedCallback(result.value);
                    if (result.done) { return resolve(); }
                    readNext();
                })
                .catch(err => {
                    reader.cancel('error');
                    reject(err);
                });
            })();
        })
    }
    else {
        data = await res.text();
    }

    const isJSON = data[0] === '{' || data[0] === '['; // || (res.headers['content-type'] || '').startsWith('application/json')
    if (res.status === 200) {
        let context = res.headers.get('AceBase-Context');
        if (context && context[0] === '{') { context = JSON.parse(context); }
        else { context = {}; }
        if (isJSON) { data = JSON.parse(data); }
        return { context, data };
    }
    else {
        request.body = postData;
        const response = {
            statusCode: res.status,
            statusMessage: res.statusText,
            headers: res.headers,
            body: data
        };
        let code = res.status, message = res.statusText;
        if (isJSON) {
            let err = JSON.parse(data);
            if (err.code) { code = err.code; }
            if (err.message) { message = err.message; }
        }
        throw(new AceBaseRequestError(request, response, code, message));
    }

}

module.exports = request;