"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.startServer = void 0;
const acebase_server_1 = require("acebase-server");
const cache_js_1 = require("./cache.js");
const settings_js_1 = require("./settings.js");
async function startServer(dbname) {
    const server = new acebase_server_1.AceBaseServer(dbname, { port: settings_js_1.settings.port, authentication: { enabled: true, defaultAdminPassword: settings_js_1.settings.password } });
    await server.ready();
    return server;
}
exports.startServer = startServer;
async function run(modules, Client, Database) {
    const dbname = `test-${modules}`;
    // Start server
    const server = await startServer(dbname);
    // Connect
    const client = new Client({ dbname, host: 'localhost', port: settings_js_1.settings.port, https: false });
    console.log(`${modules} module load test succeeded`);
    await client.ready();
    console.log('Connected');
    // Disconnect
    client.disconnect();
    // Reconnect
    await client.connect();
    // Sign in as admin
    let user = await client.auth.signIn('admin', settings_js_1.settings.password);
    console.log('Signed in as admin', user);
    // Sign out
    await client.auth.signOut();
    // Sign in with token
    user = await client.auth.signInWithToken(user.accessToken);
    console.log('Signed in with token', user);
    // Pause server
    await server.pause();
    // TODO: Expect to be disconnected
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Resume server
    await server.resume();
    // TODO: Expect to reconnect
    // Store test data
    await client.ref('test').set({
        text: `Storing this text from ${modules} tests`,
    });
    // Pause to optionally test SIGINT handling
    console.log(`Disconnecting in 5s... Press Ctrl+C to manually test graceful exiting`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Disconnect
    client.disconnect();
    await (0, cache_js_1.cacheTest)(modules, server, Client, Database);
    // Stop server
    server.shutdown();
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Create another client that does not connect automatically
    const db2 = new Client({ dbname, host: 'localhost', port: settings_js_1.settings.port, https: false, autoConnect: false });
    // Pause to optionally test SIGINT handling
    console.log(`Exit in 5s... Press Ctrl+C to manually test idle exit`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Tests done');
}
exports.run = run;
