import { AceBaseServer } from 'acebase-server';
import { settings } from './settings.js';
async function startServer(dbname) {
    const server = new AceBaseServer(dbname, { port: settings.port, authentication: { enabled: true, defaultAdminPassword: settings.password } });
    await server.ready();
    return server;
}
export async function run(modules, Client) {
    const dbname = `test-${modules}`;
    // Start server
    const server = await startServer(dbname);
    // Connect
    const db = new Client({ dbname, host: 'localhost', port: settings.port, https: false });
    console.log(`${modules} module load test succeeded`);
    await db.ready();
    console.log('Connected');
    // Disconnect
    db.disconnect();
    // Reconnect
    await db.connect();
    // Sign in as admin
    let user = await db.auth.signIn('admin', settings.password);
    console.log('Signed in as admin', user);
    // Sign out
    await db.auth.signOut();
    // Sign in with token
    user = await db.auth.signInWithToken(user.accessToken);
    console.log('Signed in with token', user);
    // Pause server
    await server.pause();
    // TODO: Expect to be disconnected
    // Resume server
    await server.resume();
    // TODO: Expect to reconnect
    // Store test data
    await db.ref('test').set({
        text: `Storing this text from ${modules} tests`,
    });
    // Pause to optionally test SIGINT handling
    console.log(`Disconnecting in 5s... Press Ctrl+C to manually test graceful exiting`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Disconnect
    db.disconnect();
    // Stop server
    server.shutdown();
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Create another client that does not connect automatically
    const db2 = new Client({ dbname, host: 'localhost', port: settings.port, https: false, autoConnect: false });
    // Pause to optionally test SIGINT handling
    console.log(`Exit in 5s... Press Ctrl+C to manually test idle exit`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Tests done');
}
