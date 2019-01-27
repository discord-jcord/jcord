# Jcord 
Jcord is an easy to use Discord API Library, Maintained by [KevvyCodes](https://github.com/KevvyCodes/)

## Documentation
- [Stable](https://jcord.js.org/)  
- [Master](https://jcord.js.org/master)

## How-to
- [Installation](https://github.com/discord-jcord/jcord/blob/master/README.md#installation)  
- [Examples](https://github.com/discord-jcord/jcord/blob/master/README.md#examples)

## Installation
Jcord can be used on **any** operating system that uses NodeJS.  
Installing Jcord is pretty easy, and there are two Major versions you can install.  

- [Master](https://github.com/discord-jcord/jcord/blob/master/README.md#master)  
- [Stable](https://github.com/discord-jcord/jcord/blob/master/README.md#stable)

### Master
**Warning**: Install Jcord's Master Version can be very buggy, but the benefit from this is it's being updated frequently. We only update the stable version for minor bug fixes and once a version of Master is done.  

If you are willing to install the Master version of Jcord, simply type this into your cmd/terminal: `$ npm install --save discord-jcord/jcord`

### Stable
If you are willing to install the Latest version of Jcord Stable, simply type this into your cmd/terminal: `$ npm install --save jcord`

## Examples
JCord has two kinds of Usage, which are the Classic and the Command Creator.  
If you want to build a flexible bot, i suggest you use the Classic Jcord, while if you're planning to build a bot with simplicity and not that complex, use the Command Creator

### Classic Usage
```js
// Require the Jcord package
const Jcord = require('jcord');

// Extend the Jcord#Client class to add properties the right way
class MyBot extends Jcord.Client {
  constructor(options) {
    super(options);
    this.token = 'Your bot\'s token';
  }
};

// Now, make a constant variable for you extended Client
const client = new MyBot({ shardCount: 'auto' }); // You can still use Jcord#Client options here

/*
  Listen for the SHARD_READY event.
  The SHARD_READY event is emitted
  once a Shard's status becomes ready.
  */

client.on('SHARD_READY', (shard) => console.log(`Shard ${shard.id} is now ready!`));

/*
  Listen for the READY event.
  The READY event is emitted
  once all Shard are connected
  to Discord
  */

client.on('READY', () => console.log(`Ready! All shards connected. Logged in as ${client.user.tag}`));

/*
  Listen for the MESSAGE_CREATE event.
  The MESSAGE_CREATE event is emitted
  once a message is seen by the bot
  */

client.on('MESSAGE_CREATE', (msg) => {
  if (msg.channel.type === 'dm') { // If we talk to the bot in dms, it will execute everything inside the brackets
    if (msg.content === '!ping') {
      msg.channel.createMessage(`Pong! Shard 0 took ${client.shards.get('0').latency}ms`)
    }
  } else {
    // If the channel type is not dm, execute every code in here
    if (msg.content === '!ping') {
      msg.channel.createMessage(`Pong! Shard ${msg.channel.guild.shard.id} took ${msg.channel.guild.shard.latency}ms`)
    }
  };
});

client.initiate(client.token);
```

### Command Creator Usage
```js
// Require the Jcord package
const Jcord = require('jcord');

// Extend the Jcord#CommandCreator class to add properties the right way
class MyBot extends Jcord.CommandCreator {
  constructor(options) {
    super(options);
    this.token = 'Your bot\'s token';
  }
};

// Now, make a constant variable for you extended Client
const client = new MyBot({ shardCount: 'auto', defaultPrefix: '!' }); // You can still use Jcord#Client options here

/*
  Listen for the SHARD_READY event.
  The SHARD_READY event is emitted
  once a Shard's status becomes ready.
  */

client.on('SHARD_READY', (shard) => console.log(`Shard ${shard.id} is now ready!`));

/*
  Listen for the READY event.
  The READY event is emitted
  once all Shard are connected
  to Discord
  */

client.on('READY', () => console.log(`Ready! All shards connected. Logged in as ${client.user.tag}`));

// We can Register a Command to the cache using CommandCreator#registerCommand
client.registerCommand('ping', 'pong!');

client.initiate(client.token);
```
