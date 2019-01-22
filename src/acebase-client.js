const { AceBaseBase } = require('acebase-core');
const { WebApi } = require('./api-web');
const { AceBaseClientAuth } = require('./auth');

/**
 * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
 * @extends module:acebase-core/AceBaseBase
 */
class AceBaseClient extends AceBaseBase {

    /**
     * Create a client to access an AceBase server
     * @param {string} host Host name, eg "localhost", or "mydb.domain.com"
     * @param {number} port Port number the server is running on
     * @param {string} dbname Name of the database you want to access
     * @param {boolean} https Use SSL (https) to access the server or not. Default: true
     */
    constructor(host, port, dbname, https = true) {
        super(dbname, {});
        let ready = false;
        this._connected = false;
        let api = new WebApi(dbname, { url: `http${https ? 's' : ''}://${host}:${port}` }, evt => {
            if (evt === 'connect') {
                this._connected = true;
                if (!ready) { 
                    ready = true; 
                    this.emit('ready');
                }
                else {
                    this.emit('connect');
                }
            }
            else if (evt === 'disconnect') {
                this._connected = false;
                this.emit('disconnect');
            }
        });
        this.auth = new AceBaseClientAuth(api, (event, arg) => {
            this.emit(event, arg);
        });
    }

    get connected() {
        return this._connected;
    }

}

module.exports = { AceBaseClient };