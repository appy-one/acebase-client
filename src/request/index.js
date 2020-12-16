const http = require('http');
const https = require('https');
const URL = require('url');
const { AceBaseRequestError } = require('./error');

function request(method, url, options = { accessToken: null, data: null, dataReceivedCallback: null, context: null }) {
    return new Promise((resolve, reject) => {
        let endpoint = URL.parse(url);

        let postData = options.data;
        if (typeof postData === 'undefined' || postData === null) {
            postData = '';
        }
        else if (typeof postData === 'object') {
            postData = JSON.stringify(postData);
        }
        const request = {
            method: method,
            protocol: endpoint.protocol,
            host: endpoint.hostname,
            port: endpoint.port,
            path: endpoint.path, //.pathname,
            headers: {
                'AceBase-Context': JSON.stringify(options.context || null),
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        if (options.accessToken) {
            request.headers['Authorization'] = `Bearer ${options.accessToken}`;
        }
        const client = request.protocol === 'https:' ? https : http;
        const req = client.request(request, res => {
            res.setEncoding("utf8");
            let data = '';
            if (typeof options.dataReceivedCallback === 'function') {
                res.on('data', options.dataReceivedCallback);
            }
            else {
                res.on('data', chunk => { data += chunk; });
            }
            res.on('end', () => {
                if (res.statusCode === 200) {
                    if (data[0] === '{') {
                        let val = JSON.parse(data);
                        // console.log('Delaying data retrieval...')
                        // setTimeout(() => resolve(val), 2500);
                        resolve(val);
                    }
                    else {
                        resolve(data);
                    }
                }
                else {
                    request.body = postData;
                    const response = {
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        body: data
                    };
                    let code = res.statusCode, message = res.statusMessage;
                    if (data[0] == '{') {
                        let err = JSON.parse(data);
                        if (err.code) { code = err.code; }
                        if (err.message) { message = err.message; }
                    }
                    return reject(new AceBaseRequestError(request, response, code, message));
                }
            });
        });

        req.on('error', (err) => {
            reject(new AceBaseRequestError(request, null, err.code || err.name, err.message));
        });

        if (postData.length > 0) {
            req.write(postData);
        }
        req.end();
    });
};

module.exports = request;