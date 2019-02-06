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
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/acebase-client@0.7.0/dist/browser.js"></script>
```

## Connect to an AceBase server

Use the following code the connect to an AceBase webserver:

```javascript
const dbname = 'mydb';
const db = new AceBaseClient(dbname, "localhost", 5757);
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

If the server you are connecting to has authentication enabled, you can (or even might have to) sign in to access specific resources. To so this, use the ```auth``` authentication api.

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

## More information

See *acebase-server* for more information about running an AceBase server ([npm](https://www.npmjs.com/package/acebase-server), [github](https://github.com/appy-one/acebase-server)) 

See *acebase* for more information about how to use AceBase ([npm](https://www.npmjs.com/package/acebase), [github](https://github.com/appy-one/acebase-core))