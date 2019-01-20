"use strict";

const EventEmitter = require('events').EventEmitter;
const Shard = require('../websocket/Shard');
const Store = require('../utils/Store');
const RestHandler = require('../rest/RestHandler');
const User = require('../models/User');
const { ENDPOINTS } = require('../utils/Constants').HTTP;
const DMChannel = require('../models/DMChannel');
const Message = require('../models/Message');

/**
 * @extends EventEmitter Represents a Discord Client
 * @prop {Store} channels Where channels are being cached
 * @prop {Store} guilds Where guilds are being cached
 * @prop {String} token The token of the client
 * @prop {Store} users Where users are being cached
 * @prop {Object} [options] Options for the Discord Client
 * @prop {Number|String} [options.shardCount=1] The amount of shards to use
 * @prop {Boolean} [options.disableEveryone=true] Whether to disable the @everyone ping
 * @prop {Boolean} [options.getAllMembers=false] Whether to fetch all members on each guild regardless of being offline or not
 * @prop {Boolean} [options.storeMessages=false] Whether to store messages in a cache, once the bot restarts the messages in the cache will be gone and can't be re-added automatically
 */

class Client extends EventEmitter {
  constructor(options = {}) {
    super(options);
    this.shardCount = options.shardCount || 1;
    this.firstShardSent = false;
    this.getAllMembers = options.getAllMembers || false;
    this.storeMessages = options.storeMessages || false;
    this.logger = options.logger || false;
    this.largeThreshold = options.largeThreshold || 250;
    this.chalk = null;

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

    this.rest = new RestHandler(this);
    this.gatewayURL = null;

    Object.defineProperty(this, 'connectedShards', { value: new Store() });
    Object.defineProperty(this, 'token', { value: null, writable: true });
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
    return this.rest.request("GET", ENDPOINTS.USER(user))
    .then(res => {
      return this.users.set(res.data.id, new User(this, res.data));
    });
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
   * Creates an embed to a channel
   * @param {Snowflake} channel The id of the channel to send a message to
   * @param {Object} embed The embed to send
   * @returns {Promise<Message>}
   */

  createEmbed(channel, embed) {
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
   * @param {Snowflake} channel The id of the channel to send a message to
   * @param {String} content The content to send
   * @returns {Promise<Message>}
   */

  createMessage(channel, content) {
    return this.rest.request("POST", ENDPOINTS.CHANNEL_MESSAGES(channel), {
      data: {
        content
      }
    }).then(res => {
      return new Message(this, res.data);
    });
  }

  /**
   * This will start connecting to the gateway using the given bot token
   * @deprecated
   * @param {String} token The token of the user
   * @returns {Void}
   */

  start(token) {
    console.warn(`Client#start() has been deprecated! Please use Client#initiate() instead.`);
    return this.initiate(token);
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

    for (let i = 0; i < this.shardCount; i++) {
      setTimeout(() => {
        new Shard(this, i).connect();
      }, i * 6500);
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
};

module.exports = Client;