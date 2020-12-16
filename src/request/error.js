class AceBaseRequestError extends Error {
    constructor(request, response, code, message) {
        super(message);
        this.code = code;
        this.request = request;
        this.response = response;
    }
}
const NOT_CONNECTED_ERROR_MESSAGE = 'remote database is not connected'; //'AceBaseClient is not connected';

module.exports = { AceBaseRequestError, NOT_CONNECTED_ERROR_MESSAGE };