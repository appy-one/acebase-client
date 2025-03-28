"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheTest = void 0;
const settings_js_1 = require("./settings.js");
async function cacheTest(modules, server, Client, Database) {
    const dbname = `test-${modules}`;
    const cacheDbName = `${dbname}-cache`;
    // Create cache db
    const cacheDb = new Database(cacheDbName);
    // Connect to server
    const client = new Client({ dbname, host: 'localhost', port: settings_js_1.settings.port, https: false, cache: { db: cacheDb } });
    await client.ready();
    console.log('Connected');
    // Sign in as admin
    const user = await client.auth.signIn('admin', settings_js_1.settings.password);
    console.log('Signed in as admin', user);
    const stream = client.root.on('notify_child_added', { newOnly: true });
    const subscription = stream.subscribe(ref => {
        console.log(`New child added: ${ref.path}`);
    }, (activated, cancelReason) => {
        console.log(`Subscription ${activated ? 'activated' : `canceled: ${cancelReason}`}`);
    });
    await subscription.activated();
    await client.ref('ewout').set('My name is Ewout');
    // Disconnect
    client.disconnect();
}
exports.cacheTest = cacheTest;
