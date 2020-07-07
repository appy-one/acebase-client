# AceBase realtime database client

This repository is to connect to a remote AceBase server. See [AceBase](https://www.npmjs.com/package/acebase) for more information about AceBase databases and usage.

## Getting started

Install the *acebase-client* npm package: ```npm install acebase-client``` ([github](https://github.com/appy-one/acebase-client), [npm](https://www.npmjs.com/package/acebase-client))

Then, ```require``` it like so:

```javascript
const { AceBaseClient } = require('acebase-client');
```

OR, if you want to use the client in the browser, use the following code:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/acebase-client@latest/dist/browser.min.js"></script>
```

## Connect to an AceBase server

Use the following code the connect to an AceBase webserver:

```javascript
const db = new AceBaseClient({ host: "localhost", port: 5757, dbname: 'mydb', https: false });
db.ready(() => {
    console.log("Connected successfully");
});
```

After the *ready* event has fired, you can read, write, setup data change event listeners etc:

```javascript
const user = {
    id: 'john_doe'
};

// Log something to the database...
db.ref('log').push({
    user: user.id,
    type: 'connect',
    datetime: new Date()
});

// Read something from the database...
const userRef = db.ref(`users/${user.id}`);
userRef.get(snapshot => {
    let details = snapshot.val();
    user.name = details.name;
});

// Get notifications for data events
const todoRef = userRef.child('todo');
todoRef.on('child_added', (snapshot) => {
    const item = snapshot.val();
    console.log(`Added to the todo list: ${item.text}`);
})

// Query to last 50 posts from less than a day ago, containing the word "awesome"
db.query('posts')
.filter('posted', '>', yesterday)
.filter('title', 'matches', /awesome/i)
.take(50)
.sort('posted')
.get(snaps => {
    // snaps is an array of matching posts
    const posts = snaps.map(snap => snap.val());
});

// Get data but exclude nested data
db.ref('users/some_user')
.get({ exclude: ['posts'] })
.then(snap => {
    // snap contains all user's properties except "users/some_user/posts"
})
```

## Authentication

If the server you are connecting to has authentication enabled, you can (or have to) sign in to access specific resources. To so this, use the ```auth``` authentication api.

### Sign in with username:
```javascript
db.auth.signIn('admin', 'thepassword')
.then(result => {
    console.log(`Signed in as ${result.user.username}, got access token ${result.accessToken}`);
})
```

### Sign in with email:
```javascript
db.auth.signInWithEmail('me@appy.one', 'thepassword')
.then(result => {
    console.log(`Signed in as ${result.user.email}, got access token ${result.accessToken}`);
})
```

### Sign in with access token:

Because storing a user's password is a bad thing (NEVER do that!), the ```signIn``` and ```signInWithEmail``` methods return an accessToken you can store somewhere. The next time a user runs your app, you can use the accessToken to automically sign them in again.

```javascript
db.auth.signInWithToken(accessToken)
.then(result => {
    console.log(`Signed in as ${result.user.email}, got access token ${result.accessToken}`);
})
```

### Signing out:
```javascript
db.auth.signOut()
.then(result => {
    console.log(`Signed out!`);
})
```

### Create a new user account:

You can create a new user account by passing ```username``` or ```email``` (or both), and ```displayName``` and ```password``` to the ```signUp``` method. A currently signed in user will be signed out, and the newly created user will be signed in automatically.

```javascript
let userDetails = {
    username: 'ewout',      // optional when email is given
    email: 'me@appy.one',   // optional when username is given
    displayName: 'Ewout Stortenbeker',
    password: 'TooEasy4U?' // password requires a-z, A-Z and 0-9
};
db.auth.signUp(details)
.then(result => {
    console.log(`Signed up and in as ${result.user.username}, got access token ${result.accessToken}`);
})
```

NOTE: Users are only able to ```signUp``` themselves if the connected AceBase server configuration allows for it. (see ```allowUserSignup``` in the [server documentation](https://www.npmjs.com/package/acebase-server))

NOTE: If you are signed in as ```admin```, calling ```signUp``` will keep you signed into your own account, and the callback will not include the ```accessToken```.

### Change password

To change the password of the signed in user, use ```changePassword```:

```javascript
db.auth.changePassword(currentPassword, newPassword)
.then(result => {
    console.log(`Changed password, new accessToken is: ${result.accessToken}`);
})
```

NOTE: When a password is changed, any access tokens given to clients signed in with the old password become invalid. All clients using the old password for the account will have to sign in again.

### Change email address

Users can change their email address using ```changeEmail```

```javascript
db.auth.changeEmail(newEmailAddress)
.then(result => {
    console.log(`Changed email address`);
})
.catch(err => {
    if (err.code === 'conflict') {
        console.log('Email address belongs to a different account');
    }
})
```

### Change username

```javascript
db.auth.changeUsername(newUsername)
.then(result => {
    console.log(`Changed username`);
})
.catch(err => {
    if (err.code === 'conflict') {
        console.log('Username belongs to a different account');
    }
})
```

### Add miscellaneous data to user account

You can store up to 100 additional fields of data with the user account, to eliminate the need for user data to be added to the main database. You can do this with ```updateUserSettings```:

```javascript
let updates = {
    profilePic: 'https://profile.com/pic.jpg',
    website: 'http://website.com',
    gameScore: 3459
}
db.auth.updateUserSettings(updates)
.then(result => {
    console.log(`Updated user settings: `, result.user.settings);
})
```

NOTE: These settings can be read from ```db.auth.user.settings```.

### Deleting account

To completely remove an account from the database, use ```deleteAccount```

```javascript
db.auth.deleteAccount()
.then(result => {
    console.log(`Account is gone and we're signed out`);
})
```

NOTE: This does not remove any data you have stored for this user, it only removes the account. You will have to remove any data yourself, eg by ```db.ref('posts').child(db.auth.user.uid).remove()```

## Monitoring user events

To keep track of sign in and out events in the background, add listeners to the 'signin' and 'signout' events:

```javascript
db.on('signin', evt => {
    console.log(`User ${evt.user.uid} signed in, source: ${evt.source}`);
    // evt.source can be one of these: 'signin', 'email_signin', 'token_signin', 'password_change', 'signup'
});

db.on('signout', evt => {
    console.log(`User ${evt.user.uid} signed out, source: ${evt.source}`);
    // evt.source can be 'signout', 'signup' or 'delete_account'
});
```

## Monitoring connection events

Use the ```connect``` and ```disconnect``` events to detect if the connection with the server has been broken or re-established:

```javascript
db.on('connect', evt => {
    console.log('Connected');
});

db.on('disconnect', evt => {
    console.log('Disconnected');
});
```

## Offline access & synchronization

If you want to be able to use the database even if your app goes offline, you can use a local AceBase database as cache db. While online, any data you fetch from the server will be cached in your local database, and data changes will also update the local cache. When the app goes offline, all requests for data will be served from cache, updates will be logged and performed on the cached data, and data change events will be fired by the cache db. Once the client connects to the server again, it will synchronize all changes with the server.

```javascript
const localCacheDb = new AceBase('offlinecache');
const client = new AceBaseClient({ 
    cache: { db: localCacheDb }, // Enables offline access
    host: 'my.acebase.server', port: 443, https: true, dbname: 'mydb'
});

client.ref('some/data').set('Works even when offline');
```

### Synchronization

AceBase uses a simple synchronization, conflict avoiding approach: all changes made offline will be replicated to the server once it reconnects. It does not check if the data being updated was changed by other clients in the mean time. That means that the last one to update the server data, wins a conflict. 

In many situations this approach is acceptible, because AceBase updates are performed on the property level: if 2 clients both changed my e-mail address in ```users/ewout/email```, there is no easy way to determine which edit should 'win' the conflict. Some would argue time-based logic should be used to resolve conflicts, to avoid an offline client for 2 months overwriting a value just updated yesterday. I would argue that even a long-time offline client _might_ have a good reason to 'win' the conflict.

In situations where you think this sync strategy might be a problem, you can easily implement history tracking on your server, allowing users to revert changes made to any point in time. Doing this will make your users happy: the app didn't decide what update was the "right" one while tossing away others - you kept track and the user can fix anything sync'ed "wrong":

```javascript
// Run this on the server:
db.ref("users/$uid/$property").on("value", snap => {
    // Logs any user property being changed
    const uid = snap.ref.vars['uid'];
    const property = snap.ref.vars['property'];
    const value = snap.val();

    // create edit history item at "history/users/[uid]/[newuniqueid]"
    db.ref("history/users").child(uid).push({ time: Date.now(), property, value });
});
```

Getting change history for any user now is a breeze:
```javascript
db.ref("history/users/ewout").get()
.then(snap => {
    // Got all edits to my user account
    const allEdits = snap.val(); 
})
```

And, reverting to a previous edit:
```javascript
const edit = allEdits[userChosenEditId];
db.ref("history/users/ewout").child(edit.property).set(edit.value);
```

### Offline transactions

Running transactions while offline is impossible because there is no access to live data. The idea behind a transaction is being able to change data that is guaranteed not to be changed by others while you are processing it. Because this is not possible with cached data, running transactions offline has been disabled since client v0.9.22. 

If you want your app to be optimistic about the outcome of a transaction while offline, handle it with the knowledge you have now (eg is the last known balance sufficient?) and run the actual transactions once the connection is back online. This requires a bit more work, but you'll be able to let a user pay for something offline, and commit or reverse the purchase once the connection is back.

See the example below, where users are able to purchase inventory while being offline:

```javascript
const userId = db.auth.user.uid; // Assuming signed in user here!

// Keep track of inventory
let inventory = [];
db.ref(`users/${userId}/inventory`).on('child_added', snap => {
    inventory.push(snap.key);
});
db.ref(`users/${userId}/inventory`).on('child_removed', snap => {
    inventory.push(snap.key);
});

// Keep track of balance
let balance = 0;
db.ref(`users/${userId}/balance`).on('value', snap => {
    balance = snap.val();
});

// Function we'll call if we're online
function purchaseOnline(item) {
    // If we're online, perform transaction
    return db.ref(`users/${userId}/inventory`).transaction(snap => {
        // Check if the user doesn't already have this item
        const inventory = snap.val();
        const hasItem = item.id in inventory;
        if (hasItem) {
            throw new Error(`You already own a ${item.name}`);
        }
        else {
            inventory[item.id] = true;
        }

        // Is there is enough cash?
        return db.ref(`users/${userId}/balance`).transaction(snap => {
            let balance = snap.val();
            balance -= item.price;
            if (balance < 0) {
                throw new Error(`You don't have enough money to buy a ${item.name}!`);
            }
            // Ok, update balance
            return balance;
        })
        .then(() => {
            // Now update inventory
            return inventory;
        });
    });
}

// Function we'll call when we're offline.
async function purchaseOffline(item) {
    // If we're offline, perform in-memory balance and inventory checks
    if (inventory.contains(item.id)) {
        throw new Error(`You already own a ${item.name}`);
    }
    if (balance < item.price) {
        throw new Error(`You don't have enough money to buy a ${item.name}`);
    }

    // Now add the purchase to a pending_purchases collection that will be processed when we're online again
    return db.ref(`users/${userId}/pending_purchases`).push(item)
    .then(() => {
        // Subtract from in-memory balance
        balance -= item.price;
        // Add to in-memory inventory
        inventory.push(item.id);
    })
}

// Function that initiates offline and online purchases, depending on connection state
function purchase(item) {
    if (db.connected) {
        return purchaseOnline(item);
    }
    else {
        return purchaseOffline(item);
    }
}

// Function that synchronizes purchases done offline
function processOfflinePurchases() {

    // Reload inventory from online db
    inventory.splice(0);
    return db.ref(`users/${userId}/inventory`).get()
    .then(snap => {
        // Got inventory
        snap.forEach(childSnap => {
            inventory.push(childSnap.key);
        });

        // Reload balance from online db
        return db.ref(`users/${userId}/balance`).get();
    })
    .then(snap => {
        // Got balance
        balance = snap.val();

        // Perform transaction on pending_purchases
        db.ref(`users/${userId}/pending_purchases`).transaction(pendingSnap => {
            const purchasePromises = [];
            pendingSnap.forEach(snap => {
                const item = snap.val();

                // Purchase item online
                const promise = purchaseOnline(item).catch(err => {
                    // Online purchase failed.
                    // User either double-spent their money, or purchased the item already
                    // Should tell the user
                });
                
                // Add to promise array
                purchasePromises.push(promise);
            });

            // Now wait until all purchases completed
            return Promise.all(purchasePromises);
        })
        .then(() => {
            // All purchases were now processed online, return null to delete pending_purchases
            return null;
        });
    });
});

// Keep track of synchronization event (happens after reconnect) to complete pending purchases
db.on('sync_done', processOfflinePurchases);

// Now, let's purchase a sword
purchase({ id: 'sword', name: 'Massive shiny sword', price: 2 })
.then(() => {
    // Success!
    console.log(`You've got it!`);
})
.catch(err => {
    // Ooops!
    console.error(err.message);
});

```

## More information

See *acebase-server* for more information about running an AceBase server ([npm](https://www.npmjs.com/package/acebase-server), [github](https://github.com/appy-one/acebase-server)) 

See *acebase* for more information about how to use AceBase ([npm](https://www.npmjs.com/package/acebase), [github](https://github.com/appy-one/acebase-core))