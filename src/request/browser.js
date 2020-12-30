const { AceBaseRequestError } = require('./error');

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

    if (res.status === 200) {
        if (data[0] === '{') {
            let val = JSON.parse(data);
            return val;
        }
        else {
            return data;
        }
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
        if (data[0] == '{') {
            let err = JSON.parse(data);
            if (err.code) { code = err.code; }
            if (err.message) { message = err.message; }
        }
        throw(new AceBaseRequestError(request, response, code, message));
    }

}

module.exports = request;