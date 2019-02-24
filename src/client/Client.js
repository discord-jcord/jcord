"use strict";

const EventEmitter = require('events').EventEmitter;
const Shard = require('../gateway/Shard');
const Store = require('../utils/Store');
const RestHandler = require('../rest/RestHandler');
const User = require('../models/User');
const { ENDPOINTS } = require('../utils/Constants').HTTP;
const DMChannel = require('../models/DMChannel');
const Message = require('../models/Message');
const { PERMISSIONS } = require('../utils/Constants');

/**
 * @extends EventEmitter Represents a Discord Client
 * @prop {Store} channels Where channels are being cached
 * @prop {Store} connectedShards A store of **connected** shards
 * @prop {Store} guilds Where guilds are being cached
 * @prop {String} token The token of the client
 * @prop {Store} users Where users are being cached
 * @prop {Store} shards A store of Shards
 * @prop {Number} shardCount The amount of shards to connect to Discord. ( useful for by shard status )
 * @prop {Object} [options] Options for the Discord Client
 * @prop {Number|String} [options.shardCount=1] The amount of shards to use
 * @prop {Boolean} [options.disableEveryone=true] Whether to disable the @everyone ping
 * @prop {Boolean} [options.getAllMembers=false] Whether to fetch all members on each guild regardless of being offline or not
 * @prop {Boolean} [options.storeMessages=false] Whether to store messages in a cache, once the bot restarts the messages in the cache will be gone and can't be re-added automatically
 * @prop {Number} [options.loginDelay=6500] The amount of time in ms to add a delay when connecting shards
 * @prop {Boolean} [options.logger=false] Whether to use our custom logging
 * @prop {Number} [options.largeThreshold=250] The amount of members needed to consider a guild large
 */

class Client extends EventEmitter {
  constructor(options = {}) {
    super(options);
    this.shardCount = options.shardCount || 1;
    this.firstShardSent = false;
    this.getAllMembers = options.getAllMembers || false;
    this.storeMessages = options.storeMessages || false;
    this.loginDelay = options.loginDelay || 6500;
    this.logger = options.logger || false;
    this.largeThreshold = options.largeThreshold || 250;
    this.disableEveryone = options.disableEveryone || true;
    this.chalk = null;
    this.status = null;

    if (this.logger) {
      try {
        this.chalk = require('chalk');
      } catch(error) {
        this.emit('error', new Error(`Module "chalk" is missing! Install it by typing "npm install chalk"`));
      }
    };

    if (this.shards < 1 || (typeof this.shards === 'string' && this.shards !== 'auto')) this.emit('error', new Error('Invalid amount of shards! Must be more than one or use \'auto\''));

    this.channels = new Store();
    this.guilds = new Store();
    this.shards = new Store();
    this.users = new Store();
    this.user = null;

    this.rest = new RestHandler(this);
    this.gatewayURL = null;

    let client_activity = {
      game: null,
      since: null,
      status: 'online',
      afk: false
    };

    Object.defineProperty(this, 'permissions', { value: new Store() });
    Object.defineProperty(this, 'connectedShards', { value: new Store() });
    Object.defineProperty(this, 'token', { value: null, writable: true });
    Object.defineProperty(this, 'presence', { value: client_activity, writable: true });
    Object.defineProperty(this, '_presences', { value: new Store() });
    Object.defineProperty(this, 'deprecator', { value: require('../utils/Deprecator') });

    for (var i of Object.entries(PERMISSIONS)) {
      this.permissions.set(i[0], i[1]);
    }
  }

  get uptime() {
    return this.startTime ? Date.now() - this.startTime : null;
  }

  /**
   * Creates a DMChannel between a user
   * @param {Snowflake} user The id of the recipient for the DM
   * @returns {Promise<DMChannel>}
   */

  createDM(user) {
    return this.rest.request("POST", ENDPOINTS.USER_CHANNELS('@me'), {
      data: {
        recipient_id: user
      }
    }).then(res => {
      return new DMChannel(this, res.data);
    }); 
  }

  /**
   * Creates a guild
   * @param {String} name The name for the new guild
   * @param {Object} [options] Options for the new guild
   * @param {String} [options.region] The region for the guild
   * @param {String} [options.icon] A base64 128x128 jpeg image for the guild icon
   * @returns {Promise<Guild>}
   */

  createGuild(name, options = {}) {
    return this.rest.request("POST", ENDPOINTS.GUILDS, {
      data: {
        name,
        region: options.region,
        icon: options.icon
      }
    }).then(res => {
      return this.guilds.get(res.data.id);
    });
  }

  /**
   * Creates an embed to a channel
   * @deprecated Use Client#sendMessage() instead.
   * @param {Snowflake} channel The id of the channel to send a message to
   * @param {Object} embed The embed to send
   * @returns {Promise<Message>}
   */

  createEmbed(channel, embed) {
    this.deprecator.deprecate('Client', 'createEmbed', 'Client', 'sendMessage');
    return this.rest.request("POST", ENDPOINTS.CHANNEL_MESSAGES(channel), {
      data: {
        embed: embed.hasOwnProperty('embed') ? embed.embed : embed
      }
    }).then(res => {
      return new Message(this, res.data);
    });
  }

  /**
   * Creates a message to a channel
   * @deprecated Use Client#sendMessage() instead.
   * @param {Snowflake} channel The id of the channel to send a message to
   * @param {String} content The content to send
   * @returns {Promise<Message>}
   */

  createMessage(channel, content) {
    this.deprecator.deprecate('Client', 'createMessage', 'Client', 'sendMessage');
    if (content && content.length > 2000) return this.emit('error', new Error('Message length must be equal to or less than 2000 Characters!'));

    if (this.disableEveryone) {
      content = content.replace(/@everyone/g, '@\u200beveryone');
    };

    return this.rest.request("POST", ENDPOINTS.CHANNEL_MESSAGES(channel), {
      data: {
        content
      }
    }).then(res => {
      return new Message(this, res.data);
    });
  }

  /**
   * Fetches the user from cache, if it doesn't exist use the REST API to fetch it and add to the cache
   * @param {Snowflake} user The id of the user to fetch
   * @returns {Promise<User>}
   */

  getUser(user) {
    if (!this.users.has(user)) {
      return this.rest.request("GET", ENDPOINTS.USER(user))
      .then(res => {
        return this.users.set(res.data.id, new User(this, res.data));
      });
    } else {
      return new Promise((resolve, reject) => {
        return resolve(this.users.get(user));
      });
    };
  }

  /**
   * Makes the bot leave the guild
   * @param {Snowflake} guild The id of the guild
   * @returns {Promise<Boolean>} Will return true if it's a success
   */

  leaveGuild(guild) {
    return this.rest.request("DELETE", ENDPOINTS.GUILD(guild))
    .then(() => {
      return true;
    });
  }
  
  /**
   * Spawns a shard
   * @param {Number} id The id of the shard
   * @returns {Boolean}
   */

  spawn(id) {
    return new Shard(this, id).connect();
  }

  /**
   * This will start connecting to the gateway using the given bot token
   * @param {String} token The token of the user
   * @returns {Void}
   */

  async initiate(token) {
    this.token = token;

    let data = await this.rest.request("GET", '/gateway/bot');

    this.gatewayURL = data.data.url;

    if (this.shardCount === 'auto') {
      let res = await this.rest.request("GET", '/gateway/bot');

      this.shardCount = res.data.shards;
    };

    this.emit('debug', { shard: 'Global', message: `Connecting to Discord... Shards: ${this.shardCount}` });

    for (let i = 0; i < this.shardCount; i++) {
      this.shards.set(i.toString(), null);
      setTimeout(() => {
        this.spawn(i);
      }, i * this.loginDelay);
    };
  }

  /**
   * Logs something to the console that is colored.
   * @param {String} type The type of the log
   * @param {String} message The message to log
   * @returns {Object}
   */

  log(type, message) {
    if (!this.logger) return this.emit('error', new Error('You need to install the "chalk" package!'));

    let types = ['success', 'warn', 'error', 'loading', 'retrying'];

    if (!type || type && !types.includes(type.toLowerCase())) this.emit('Invalid Type of log!');

    switch(type) {
      case 'error':
      console.log(`[${this.chalk.red('ERROR')}]: ${message}`);
        break;

      case 'loading':
        console.log(`[${this.chalk.cyan('LOADING')}]: ${message}`);
        break;

      case 'success':
        console.log(`[${this.chalk.green('SUCCESS')}]: ${message}`);
        break;

      case 'warn':
        console.log(`[${this.chalk.yellow('WARNING')}]: ${message}`);
        break;

      case 'retrying':
        console.log(`[${this.chalk.blue('RETRYING')}]: ${message}`);
        break;
    }

    return { type, message };
  }

  /**
   * Edits a message
   * @param {Snowflake} channel The id of the channel
   * @param {Snowflake} message The id of the message
   * @param {Object} options Options for the message editing
   * @param {String} options.content The content of the message
   * @param {Embed} options.embed The embed for the message
   * @returns {Promise<Message>}
   */

  patchMessage(channel, message, options = {}) {
    return this.rest.request("PATCH", ENDPOINTS.CHANNEL_MESSAGE(channel, message), {
      data: {
        content: options.content || null,
        embed: options.embed ? (options.embed.hasOwnProperty('embed') ? options.embed.embed : options.embed) : null
      }
    }).then(res => {
      return new Message(this, res.data);
    });
  }

  /**
   * Make your own log with your own type and color
   * @param {String} type The type of the log, can be anything
   * @param {String} color The color of the type
   * @param {String} message The message to log
   * @returns {Object}
   */

  customLog(type, color, message) {
    if (!this.logger) return this.emit('error', new Error('You need to install the "chalk" package!'));

    if (!type) type = 'info';
    if (!color) color = 'white';

    console.log(`[${this.chalk[color.toLowerCase()](type)}]: ${message}`);

    return { type, color, message };
  }

  /**
   * Make your own log with your own type and color using RGB
   * @param {String} type The type of the log, can be anything
   * @param {String} message The message to log
   * @param {Object} [options] The options for the RGB Color
   * @param {Number} [options.red=0] The number for the color red in the rgb data
   * @param {Number} [options.green=0] The number for the color green in the rgb data
   * @param {Number} [options.blue=0] The number for the color blue in the rgb data
   * @returns {Object}
   */

  rgbLog(type, message, options = { red: 0, green: 0, blue: 0 }) {
    if (!this.logger) return this.emit('error', new Error('You need to install the "chalk" package!'));

    console.log(`[${this.chalk.rgb(options.red, options.green, options.blue)(type)}]: ${message}`);

    return options;
  }

  /**
   * Sends a message to a channel
   * @param {Snowflake} channel 
   * @param {Object} options 
   * @param {String} [options.content] The content of the message
   * @param {Embed} [options.embed] The embed object of the message
   * @returns {Promise<Message>}
   */

  sendMessage(channel, options = {}) {
    if (options.content && typeof options.content === 'string' && options.content.length > 2000)
      return this.emit('error', new RangeError('Maximum of 2000 Characters for Content has been reached!'));

    return this.rest.request('POST', ENDPOINTS.CHANNEL_MESSAGES(channel), {
      data: {
        content: options.content || null,
        embed: options.embed ? (options.embed.hasOwnProperty('embed') ? options.embed.embed : options.embed) : null
      }
    }).then(res => {
      return new Message(this, res.data);
    });
  }

  /**
   * Sends an activity to the shard
   * @param {String} shard The id of the shard, or `'all'` for all shards
   * @param {Object} [options] The options for the Activity
   * @param {Number} [options.since=null] Unix time (in milliseconds) of when the client went idle, or null if the client is not idle
   * @param {Object} [options.game=null] The user's new activity
   * @param {String} [options.game.name=null] The activity's name
   * @param {Number} [options.game.type=0] The [activity's type](https://discordapp.com/developers/docs/topics/gateway#activity-object-activity-types)
   * @param {String} [options.game.url=null] The url of the activity ( Only for game type 1 )
   * @param {String} [options.status='online'] The new status of the client
   * @param {Boolean} [options.afk=false] Whether or not the client is afk
   * @returns {Object} The options for the Activity
   */

  setActivity(shard, options = {}) {
    if (!shard || (shard && (shard !== 'all' || shard !== 'all' && !this.connectedShards.has(shard))))
      return this.emit('error', new Error('Invalid Shard!'));
    shard = typeof shard === 'number' ? shard.toString() : shard;

    if (shard === 'all') {
      for (var i = 0; i < this.connectedShards.size; i++)
        this.connectedShards.get(i.toString()).setActivity(options);
    } else {
      this.connectedShards.get(shard).setActivity(options);
    }

    return options;
  }
};

module.exports = Client;