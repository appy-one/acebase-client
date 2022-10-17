/*
    * This file is used to generate a browser bundle to use as an include
    (re)generate it with: npm run browserify

    * To use AceBaseClient in the browser:
    <script type="text/javascript" src="dist/browser.min.js"></script>
    <script type="text/javascript">
        const db = new AceBaseClient({ dbname: 'dbname', host: 'localhost', port: 3000, https: false });
        db.ready(() => {
            // Ready to do some work
        })
    </script>
*/

import * as acebaseclient from './index';

(window as any).acebaseclient = acebaseclient;
(window as any).AceBaseClient = acebaseclient.AceBaseClient; // Shortcut to AceBaseClient

export * from './index';
