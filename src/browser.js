// To use AceBaseClient in the browser
// from root dir of package, execute: 
// npm run browserify, which will execute:
//      browserify src/browser.js -o dist/browser.js
//      terser dist/browser.js -o dist/browser.min.js

const acebase = require('./index');

window.AceBaseClient = acebase.AceBaseClient;
if (!window.acebase) {
    // Prevent clash with acebase browser build
    window.acebase = acebase; 
}
