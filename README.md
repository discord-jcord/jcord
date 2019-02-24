# Jcord
Jcord is an easy to use Discord API Library Built for NodeJS.

## Documentation
- [Stable](https://kevvycodes.me/jcord/) The Documentation for the Stable Version of Jcord  
- [Master](https://kevvycodes.me/jcord/master/) The Documentation for the Master Version of Jcord  

## Installation  
Jcord can be install on **any** operating System that has NodeJS 8+  
If you are willing to install Jcord, please install [NodeJS](https://nodejs.org), i suggest using the LTS Version.  

- [Stable](#stable)  
- [Master](#master)

### Stable
The stable version of Jcord has features that we are sure that won't break, and has no errors whatsoever, if you do overcome an error, open an Issue, and once we have fixed the Issue, install Jcord Master instead.  

`$ npm install --save jcord` - **Stable Version**

### Master
The master version of Jcord has many features, yet are tend to break. Some of them are already fixed, but some aren't. Since master version always gets new commits, you can simple report something or suggest something, and once we fix it, it will be first pushed to the Master version.  

`$ npm install --save discord-jcord/jcord` - **Master Version**

## Examples
If you are confused on how to use Jcord, here are some examples.

### Stable Usage
Classic Usage:  
```js
const Jcord = require('jcord');
const client = new Jcord.Client();

client.on('SHARD_READY', (shard) => console.log(`Shard #${shard.id} Connected!`));

client.on('READY', () => console.log(`All Shards Connected! Logged in as ${client.user.tag}`));

client.on('MESSAGE_CREATE', (message) => {
  if (message.content === 'ping') {
    message.channel.createMessage('pong!');
  }
});

client.initiate('BOT TOKEN');
```  

We also have an Example for the Command Creator 
```js
const Jcord = require('jcord');
const client = new Jcord.CommandCreator();

client.on('SHARD_READY', (shard) => console.log(`Shard #${shard.id} Connected!`));

client.on('READY', () => console.log(`All Shards Connected! Logged in as ${client.user.tag}`));

client.registerCommand('ping', 'pong!');

client.initiate('BOT TOKEN');
```  

### Master Usage
Classic Usage:  
```js
const Jcord = require('jcord');
const client = new Jcord.Client();

client.on('SHARD_READY', (shard) => console.log(`Shard #${shard.id} Connected!`));

client.on('READY', () => console.log(`All Shards Connected! Logged in as ${client.user.tag}`));

client.on('MESSAGE_CREATE', (message) => {
  if (message.content === 'ping') {
    message.channel.send({ content: 'pong!' });
  }
});

client.initiate('BOT TOKEN');
```  

We also have an Example for the Command Creator
```js
const Jcord = require('jcord');
const client = new Jcord.CommandCreator();

client.on('SHARD_READY', (shard) => console.log(`Shard #${shard.id} Connected!`));

client.on('READY', () => console.log(`All Shards Connected! Logged in as ${client.user.tag}`));

client.registerCommand('ping', 'pong!');

client.initiate('BOT TOKEN');
```  