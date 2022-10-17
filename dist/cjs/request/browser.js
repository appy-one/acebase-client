"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("./error");
/**
 * @returns returns a promise that resolves with an object containing data and an optionally returned context
 */
function request(method, url, options = { accessToken: null, data: null, dataReceivedCallback: null, dataRequestCallback: null, context: null }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let postData = options.data;
        if (typeof postData === 'undefined' || postData === null) {
            postData = '';
        }
        else if (typeof postData === 'object') {
            postData = JSON.stringify(postData);
        }
        const headers = {
            'AceBase-Context': JSON.stringify(options.context || null),
        };
        const init = {
            method,
            headers,
            body: undefined,
        };
        if (typeof options.dataRequestCallback === 'function') {
            // Stream data to the server instead of posting all from memory at once
            headers['Content-Type'] = 'text/plain'; // Prevent server middleware parsing the content as JSON
            const supportsStreaming = false;
            if (supportsStreaming) {
                // Streaming uploads appears not to be implemented in Chromium/Chrome yet.
                // Setting the body property to a ReadableStream results in the string "[object ReadableStream]"
                // See https://bugs.chromium.org/p/chromium/issues/detail?id=688906 and https://stackoverflow.com/questions/40939857/fetch-with-readablestream-as-request-body
                let canceled = false;
                init.body = new ReadableStream({
                    pull(controller) {
                        var _a;
                        return __awaiter(this, void 0, void 0, function* () {
                            const chunkSize = controller.desiredSize || 1024 * 16;
                            const chunk = yield ((_a = options.dataRequestCallback) === null || _a === void 0 ? void 0 : _a.call(options, chunkSize));
                            if (canceled || [null, ''].includes(chunk)) {
                                controller.close();
                            }
                            else {
                                controller.enqueue(chunk);
                            }
                        });
                    },
                    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
                    start(controller) {
                        return __awaiter(this, void 0, void 0, function* () { });
                    },
                    cancel() {
                        canceled = true;
                    },
                });
            }
            else {
                // Streaming not supported
                postData = '';
                const chunkSize = 1024 * 512; // Use large chunk size, we have to store everything in memory anyway.
                let chunk;
                while ((chunk = yield options.dataRequestCallback(chunkSize))) {
                    postData += chunk;
                }
                init.body = postData;
            }
        }
        else if (postData.length > 0) {
            headers['Content-Type'] = 'application/json';
            init.body = postData;
        }
        if (options.accessToken) {
            headers['Authorization'] = `Bearer ${options.accessToken}`;
        }
        const request = { url, method, headers, body: undefined };
        const res = yield fetch(request.url, init).catch(err => {
            // console.error(err);
            throw new error_1.AceBaseRequestError(request, null, 'fetch_failed', err.message);
        });
        let data = '';
        if (typeof options.dataReceivedCallback === 'function') {
            // Stream response
            const reader = (_a = res.body) === null || _a === void 0 ? void 0 : _a.getReader();
            yield new Promise((resolve, reject) => {
                (function readNext() {
                    var _a;
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            const result = yield (reader === null || reader === void 0 ? void 0 : reader.read());
                            (_a = options.dataReceivedCallback) === null || _a === void 0 ? void 0 : _a.call(options, result === null || result === void 0 ? void 0 : result.value);
                            if (result === null || result === void 0 ? void 0 : result.done) {
                                return resolve();
                            }
                            readNext();
                        }
                        catch (err) {
                            reader === null || reader === void 0 ? void 0 : reader.cancel('error');
                            reject(err);
                        }
                    });
                })();
            });
        }
        else {
            data = yield res.text();
        }
        const isJSON = data[0] === '{' || data[0] === '['; // || (res.headers['content-type'] || '').startsWith('application/json')
        if (res.status === 200) {
            const contextHeader = res.headers.get('AceBase-Context');
            let context;
            if (contextHeader && contextHeader[0] === '{') {
                context = JSON.parse(contextHeader);
            }
            else {
                context = {};
            }
            if (isJSON) {
                data = JSON.parse(data);
            }
            return { context, data };
        }
        else {
            request.body = postData;
            const response = {
                statusCode: res.status,
                statusMessage: res.statusText,
                headers: res.headers,
                body: data,
            };
            let code = res.status, message = res.statusText;
            if (isJSON) {
                const err = JSON.parse(data);
                if (err.code) {
                    code = err.code;
                }
                if (err.message) {
                    message = err.message;
                }
            }
            throw (new error_1.AceBaseRequestError(request, response, code, message));
        }
    });
}
exports.default = request;
//# sourceMappingURL=browser.js.map