"use strict";

// utils & models
const Store = require('../utils/Store');

// events
const ChannelCreate = require('./events/channelcreate');
const Ready = require('./events/ready');
const GuildCreate = require('./events/guildcreate');
const GuildMembersChunk = require('./events/GuildMembersChunk');
const PresenceUpdate = require('./events/presenceupdate');
const MessageCreate = require('./events/messagecreate');
const GuildMemberAdd = require('./events/guildmemberadd');
const GuildMemberRemove = require('./events/guildmemberremove');
const GuildMemberUpdate = require('./events/guildmemberupdate');
const RoleCreate = require('./events/rolecreate');
const RoleDelete = require('./events/roledelete');
const RoleUpdate = require('./events/roleupdate');

let Websocket;

try {
  Websocket = require('uws');
} catch(e) {
  Websocket = require('ws');
};

/**
 * @class Represents a Discord Shard
 * @prop {String} id The id of the Shard
 * @prop {Store} guilds A store of guilds of each Shard
 * @prop {Number} ms The uptime of a shard in ms
 * @prop {Number} latency The API Latency of the Shard in ms
 */

class Shard {
  constructor(client, id) {
    this.client = client;
    this.id = typeof id === 'number' ? id.toString() : id;
    this.guilds = new Store();

    // non-enumerable Properties
    Object.defineProperty(this, 'status', { value: 'offline', writable: true });
    Object.defineProperty(this, 'guildLength', { value: 0, writable: true });
    Object.defineProperty(this, 'startTime', { value: 0, writable: true });
    Object.defineProperty(this, 'totalMemberCount', { value: 0, writable: true });
    Object.defineProperty(this, 'totalMemberCountOfGuildMemberChunk', { value: 0, writable: true });
  }

  get uptime() {
    return this.startTime ? Date.now() - this.startTime : 0;
  }

  /**
   * Sends an activity to the shard
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

  setActivity(options = {}) {
    this.send({
      op: 3,
      d: {
        game: options.game || this.client.presence.game,
        since: options.sicne || this.client.presence.since,
        afk: Boolean(options.afk) || this.client.presence.afk,
        status: options.status || this.client.presence.status,
      }
    });

    return options;
  }

  /**
   * Setup some properties for the Shard
   * @returns {Shard}
   */

  setup() {
    let data = {
      latency: 0,
      seq: null,
      sessionID: null,
      heartbeatInterval: null,
      ws: null
    };

    for (let i of Object.entries(data)) {
      this[i[0]] = i[1];
    };

    return this;
  }

  /**
   * Connects the shard
   * @returns {Boolean} Whether the connect was from a reconnect
   */

  connect(reconnected = false) {
    this.initiate();

    /**
     * Emitted once a Shard is loading, inner data is a partial Shard Data
     * @event Client.SHARD_LOADING
     * @prop {String} id The id of the shard
     */

    this.client.emit('SHARD_LOADING', { id: this.id });

    // Set status to loading
    this.status = 'loading';

    // Debugger
    this.client.emit('debug', { shard: this.id, message: 'Initiating Shard, connecting...' });

    return reconnected;
  }

  /**
   * Initiate the shard
   * @returns {Shard}
   */

  initiate() {
    this.ws = new Websocket(`${this.client.gatewayURL}/?v=6&encoding=json`);

    this.ws.on('message', (event) => {
      let packet = JSON.parse(event);

      this.listen_message(packet);
    });

    return this;
  }

  /**
   * Listens for messages from the Websocket
   * @param {Object} packet The packet received from discord
   * @returns {Object<Packet>}
   */

  listen_message(packet) {
    switch(packet.op) {
      case 10:
        // Debugger
        this.client.emit('debug', { shard: this.id, message: 'Received Opcode 10 ( Hello ) from Discord!' });

        // Start heartbeating
        this.start_heartbeat(packet.d.heartbeat_interval);
        break;

      case 0:
        this.seq = packet.s;

        // Handle events
        this.listen_event(packet);
        break;

      case 11:
        this.lastHeartbeatReceived = new Date().getTime();

        // Get the latency
        this.latency = this.lastHeartbeatReceived - this.lastHeartbeatSent;
        break;

      case 9:
        if (!packet.d) {
          // Debugger #1
          this.client.emit('debug', { shard: this.id, message: 'Received Opcode 9 ( Invalid Session ). Will re-login.' });
          this.identify();
        } else {
          // Debugger #2
          this.client.emit('debug', { shard: this.id, message: 'Received Opcode 9 ( Invalid Session ). Will resume.' });

        }
        break;
    };

    return packet;
  }

  /**
   * Listens for Discord events from the Websocket
   * @param {Object} packet The packet received from discord
   * @returns {Object<Packet>}
   */

  listen_event(packet) {
    switch(packet.t) {
      case 'READY':
        new Ready().emit(this, packet);
        break;

      case 'GUILD_CREATE':
        new GuildCreate().emit(this, packet);
        break;

      case 'GUILD_MEMBERS_CHUNK':
        new GuildMembersChunk().emit(this, packet);
        break;

      case 'PRESENCE_UPDATE':
        new PresenceUpdate().emit(this, packet);
        break;

      case 'MESSAGE_CREATE':
        new MessageCreate().emit(this, packet);
        break;

      case 'GUILD_MEMBER_ADD':
        new GuildMemberAdd().emit(this, packet);
        break;

      case 'GUILD_MEMBER_REMOVE':
        new GuildMemberRemove().emit(this, packet);
        break;
      
      case 'GUILD_MEMBER_UPDATE':
        new GuildMemberUpdate().emit(this, packet);
        break;

      case 'GUILD_ROLE_CREATE':
        new RoleCreate().emit(this, packet);
        break;

      case 'GUILD_ROLE_DELETE':
        new RoleDelete().emit(this, packet);
        break;

      case 'GUILD_ROLE_UPDATE':
        new RoleUpdate().emit(this, packet);
        break;

      case 'CHANNEL_CREATE':
        new ChannelCreate().emit(this, packet);
        break;
    }
  }

  start_heartbeat(interval) {
    // Send the first heartbeat
    this.send({ op: 1, d: { seq: this.seq } });

    // Get the time the last heartbeat was sent in ms
    this.lastHeartbeatSent = new Date().getTime();

    // Debugger #1
    this.client.emit('debug', { shard: this.id, message: 'Sent the first Heartbeat to Discord! Starting Interval...' });

    // Send an identify payload
    this.identify();

    // Debugger #2
    this.client.emit('debug', { shard: this.id, message: `Sent an Opcode 2 ( Identify ) to Discord! With token: ${this.client.token}` });

    // Let's create an interval here for sending heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.send({ op: 1, d: { seq: this.seq } });

      // Get the time the last heartbeat was sent in ms
      this.lastHeartbeatSent = new Date().getTime();

      // Debugger #3
      this.client.emit('debug', { shard: this.id, message: 'Sent another Heartbeat to Discord!' });
    }, interval);

    return this;
  }

  /**
   * Sends data to the websocket
   * @param {Any} data The data to send
   * @returns {Data}
   */

  send(data) {
    this.ws.send(typeof data === 'object' ? JSON.stringify(data) : data);
    return data;
  }

  /**
   * Sends an Opcode 8 ( Request Guild Members ) to discord
   */

  fetchAllMembers(guilds) {
    return this.send({ op: 8, d: {
        guild_id: guilds,
        query: "",
        limit: 0
      }
    });
  }

  /**
   * Sends the identify payload to discord for logging in
   */

  identify() {
    return this.send({
      op: 2,
      d: {
        token: this.client.token,
        properties: {
          $os: process.platform,
          $browser: 'jcord',
          $device: 'jcord'
        },
        large_threshold: this.client.largeThreshold,
        shard: [typeof this.id === 'number' ? this.id : parseInt(this.id), this.client.shardCount]
      }
    });
  }
};

module.exports = Shard;