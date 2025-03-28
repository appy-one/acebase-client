import { AceBase } from 'acebase';
import { AceBaseServer } from 'acebase-server';
import { AceBaseClient } from '../../dist/types';
import { cacheTest } from './cache.js';
import { settings } from './settings.js';

export async function startServer(dbname: string) {
    const server = new AceBaseServer(dbname, { port: settings.port, authentication: { enabled: true, defaultAdminPassword: settings.password } });
    await server.ready();
    return server;
}

export async function run(modules: 'ESM'|'CommonJS', Client: typeof AceBaseClient, Database: typeof AceBase) {
    const dbname = `test-${modules}`;

    // Start server
    const server = await startServer(dbname);

    // Connect
    const client = new Client({ dbname, host: 'localhost', port: settings.port, https: false });
    console.log(`${modules} module load test succeeded`);
    await client.ready();
    console.log('Connected');

    // Disconnect
    client.disconnect();

    // Reconnect
    await client.connect();

    // Sign in as admin
    let user = await client.auth.signIn('admin', settings.password);
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

    await cacheTest(modules, server, Client, Database);

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
