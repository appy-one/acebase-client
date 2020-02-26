/*
    * This file is used to generate a browser bundle,
    (re)generate it with: npm run browserify
    Note to self: if browserify fails, temp remove the "browser" property from package.json and run again.

    * To use AceBaseClient in the browser:
    const db = new AceBaseClient({ dbname: 'dbname', host: 'localhost', port: 3000, https: false });
*/

const acebaseclient = require('./index');

window.acebaseclient = acebaseclient;
window.AceBaseClient = acebaseclient.AceBaseClient; // Shortcut to AceBaseClient
module.exports = acebaseclient;