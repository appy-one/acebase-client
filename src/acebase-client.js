const { AceBase } = require('acebase');
const { WebApi } = require('./api-web');
//const { EventEmitter } = require('events');

class AceBaseClient extends AceBase {
    constructor(host, port, dbname) {
        //TODO: https
        super(dbname, { api: { class: WebApi, settings: `http://${host}:${port}` } });
    }
}

module.exports = { AceBaseClient };