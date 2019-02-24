"use strict";

// utils & models
const Store = require('../utils/Store');

// events
const ChannelCreate = require('./events/channelcreate');
const ChannelUpdate = require('./events/channelupdate');
const ChannelDelete = require('./events/channeldelete');
const Ready = require('./events/ready');
const GuildCreate = require('./events/guildcreate');
const GuildDelete = require('./events/guilddelete');
const GuildMembersChunk = require('./events/guildmemberschunk');
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
    Object.defineProperty(this, 'fromReconnect', { value: false, writable: true });
  }

  get uptime() {
    return this.startTime ? Date.now() - this.startTime : 0;
  }
  
  /**
   * Disconnect/Reconnects a shard
   * @param {Boolean} [reconnect=false] Whether or not to reconnect
   * @return {Shard}
   */

  disconnect(reconnect = false) {
    if (!this.ws) return;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    try {
      if (reconnect) {
        this.client.emit('SHARD_RECONNECT', { id: this.id });
        this.status = 'reconnecting';
        this.ws.terminate();
        this.ws = null;
        setTimeout(() => {
          this.connect(true);
        }, 5000);
      } else {
        this.ws.close(1000);
      }
    } catch(error) {
      this.client.emit('error', error);
    }
    
    return this;
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

    if (reconnected) this.fromReconnect = true;

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

    this.ws.onclose = (event) => {
      let err = !event.code || event.code === 1000 ? null : new Error(event.code + ": " + event.reason);
      let reconnect = true;
      if (event.code) {
        this.client.emit("debug", { shard: this.id, message: `${event.code === 1000 ? "Clean" : "Unclean"} WS close: ${event.code}: ${event.reason}` });
        if (event.code === 4001) {
          err = new Error("Gateway received invalid OP code");
        } else if (event.code === 4002) {
          err = new Error("Gateway received invalid message");
        } else if (event.code === 4003) {
          err = new Error("Not authenticated");
        } else if (event.code === 4004) {
          err = new Error("Authentication failed");
          reconnect = false;
          this.client.emit("error", new Error(`Invalid token: ${this.client.token}`));
        } else if (event.code === 4005) {
          err = new Error("Already authenticated");
        } else if (event.code === 4006 || event.code === 4009) {
          err = new Error("Invalid session");
          this.sessionID = null;
        } else if (event.code === 4007) {
          err = new Error("Invalid sequence number: " + this.seq);
          this.seq = 0;
        } else if (event.code === 4008) {
          err = new Error("Gateway connection was ratelimited");
        } else if (event.code === 4010) {
          err = new Error("Invalid shard key");
          reconnect = false;
        } else if (event.code === 4011) {
          err = new Error("Shard has too many guilds (>2500)");
          reconnect = false;
        } else if (event.code === 1006) {
          err = new Error("Connection reset by peer");
        } else if (!event.wasClean && event.reason) {
          err = new Error(event.code + ": " + event.reason);
        }

        this.client.emit('debug', { shard: this.id, message: err.message });
      } else {
        this.client.emit("debug", { shard: this.id, message: "WS close: unknown code: " + event.reason });
      }
      this.disconnect(reconnect);

      if (this.client.connectedShards.has(this.id.toString()))
        this.client.connectedShards.delete(this.id.toString());

      this.status = 'closed';
      this.disconnect(false)

      if (this.client.connectedShards.size === 0)
        /**
         * Emitted once all shards disconnect
         * @event Client.SHARD_DISCONNECT_ALL
         * @prop {Object} data The data of the event
         * @prop {String} data.message The message
         */
        this.client.emit('SHARD_DISCONNECT_ALL', { message: 'All Shards has been disconnected!' });
      
      /**
       * Emitted once a Shard Disconnects
       * @event Client.SHARD_DISCONNECT
       * @prop {Shard} shard Partial Shard data
       * @prop {String} shard.id Id of the shard
       * @prop {String} shard.description Description of the disconnect
       * @prop {String} shard.reason Websocket reason for the disconnect
       */
      this.client.emit('SHARD_DISCONNECT', ({ id: this.id, description: `Shard Disconnected with Close Code: ${event.code}`, reason: event.reason || 'No reason given' }));
    };

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
          this.disconnect();

          this.ws = new Websocket(`${this.client.gatewayURL}?v=6&encoding=json`);
          this.ws.on('open', () => this.resume());
        }
        break;

      case 7:
        this.disconnect(true);
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
        (async() => {
          new GuildMemberUpdate().emit(this, packet);
        })();
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

      case 'CHANNEL_UPDATE':
        new ChannelUpdate().emit(this, packet);
        break;

      case 'CHANNEL_DELETE':
        new ChannelDelete().emit(this, packet);
        break;

      case 'GUILD_DELETE':  
        new GuildDelete().emit(this, packet);
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

  /**
   * Sends an Opcode 6 ( Resume ) to Discord
   */

  resume() {
    return this.send({
      op: 6,
      d: {
        token: this.client.token,
        session_id: this.sessionID,
        seq: this.seq
      }
    })
  }
};

module.exports = Shard;