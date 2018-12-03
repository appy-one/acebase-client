// To use AceBaseClient in the browser
// from root dir of package, execute: browserify src/browser.js -o dist/browser.js
window.AceBase = require('./index');
window.AceBaseClient = window.AceBase.AceBaseClient;
