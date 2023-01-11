import { AceBase } from 'acebase';
import { AceBaseServer } from 'acebase-server';
import { AceBaseClient } from '../../dist/types';
import { settings } from './settings.js';

export async function cacheTest(modules: 'ESM'|'CommonJS', server: AceBaseServer, Client: typeof AceBaseClient, Database: typeof AceBase) {
    const dbname = `test-${modules}`;
    const cacheDbName = `${dbname}-cache`;

    // Create cache db
    const cacheDb = new Database(cacheDbName);

    // Connect to server
    const client = new Client({ dbname, host: 'localhost', port: settings.port, https: false, cache: { db: cacheDb } });
    await client.ready();
    console.log('Connected');

    // Sign in as admin
    const user = await client.auth.signIn('admin', settings.password);
    console.log('Signed in as admin', user);

    const stream = client.root.on('notify_child_added', { newOnly: true });
    const subscription = stream.subscribe(ref => {
        console.log(`New child added: ${ref.path}`);
    }, (activated, cancelReason) => {
        console.log(`Subscription ${activated ? 'activated' : `canceled: ${cancelReason}` }`);
    });

    await subscription.activated();
    await client.ref('ewout').set('My name is Ewout');

    // Disconnect
    client.disconnect();
}
