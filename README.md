# AceBase database client

This repository is to connect to a remote AceBase server. See [AceBase](https://www.npmjs.com/package/acebase) for more information about AceBase databases and usage.

## Getting started

Install the *acebase-client* npm package: ```npm install acebase-client``` ([github](https://github.com/appy-one/acebase-client), [npm](https://www.npmjs.com/package/acebase-client))

## Connect to an AceBase server

Use the following code the connect to an AceBase webserver:

```javascript
const { AceBaseClient } = require('acebase-client');
const dbname = 'mydb';
const db = new AceBaseClient(dbname, "localhost", 5757);
db.on("ready", () => {
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
.where('posted', '>', yesterday)
.where('title', 'matches', /awesome/i)
.take(50)
.order('posted')
.get()
.then(snaps => {
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

## More information

See *acebase-server* for more information about running an AceBase server ([npm](https://www.npmjs.com/package/acebase-server), [github](https://github.com/appy-one/acebase-server)) 

See *acebase* for more information about how to use AceBase ([npm](https://www.npmjs.com/package/acebase), [github](https://github.com/appy-one/acebase-core))