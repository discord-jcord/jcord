"use strict";

const TextChannel = require('../models/TextChannel');
const VoiceChannel = require('../models/VoiceChannel');
const CategoryChannel = require('../models/CategoryChannel');
const DMChannel = require('../models/DMChannel');
const Guild = require('../models/Guild');
const ClientUser = require('../models/ClientUser');
const User = require('../models/User');
const Member = require('../models/Member');
const Role = require('../models/Role');
const Message = require('../models/Message');
const Store = require('../utils/Store');

let Websocket;

try {
  Websocket = require('uws');
} catch(err) {
  Websocket = require('ws');
};

/**
 * @class The Shard for the Client
 * @prop {Number} latency The latency of the shard
 * @prop {Number|String} id The id of the shard, it will only be a string if it's in the Client#shards
 * @prop {Store} guilds A store of Guilds connected to the Shard
 */

class Shard {
  constructor(client, id) {
    this.client = client;
    this.id = id;
    
    // non-enumerable properties
    Object.defineProperty(this, 'guildLength', { value: 0, writable: true });
    Object.defineProperty(this, 'totalMemberCount', { value: 0, writable: true });
    Object.defineProperty(this, 'totalMemberCountOfGuildMemberChunk', { value: 0, writable: true });
    Object.defineProperty(this, 'startTime', { value: 0, writable: true });
    Object.defineProperty(this, 'status', { value: '', writable: true });

    this.setup();
  }

  get uptime() {
    return this.startTime ? Date.now() - this.startTime : null;
  }

  disconnect(code = 1000) {
    this.ws.close(code);
    return true;
  }

  /**
   * Reconnects the shard
   */

  reconnect() {
    this.client.emit('SHARD_RECONNECT', ({ id: this.id }));

    if (this.status !== 'closed') {
      this.disconnect();
    };

    setTimeout(() => {
      this.status = 'reconnecting';
      this.connect(true);
    }, 5000);

    return true;
  }

  /**
   * Connects a shard
   */

  connect(reconnected) {
    if (reconnected) {
      this.initiate();
      return true;
    } else {
      this.initiate();
      return false;
    }
  }

  initiate() {
    this.ws = new Websocket(`${this.client.gatewayURL}/?v=6&encoding=json`);

    this.ws.on('message', (event) => {
      let packet = JSON.parse(event);

      this.onMessage(packet);
    });

    this.ws.onclose = (event) => {
      clearInterval(this.heartbeatInterval);
      if (this.client.connectedShards.has(this.id.toString())) this.client.connectedShards.delete(this.id.toString());
      this.heartbeatInterval = null;
      this.status = 'closed';
      this.client.emit('SHARD_DISCONNECT', ({ id: this.id, description: `Shard Disconnected with Close Code: ${event.code}`, reason: event.reason || 'No reason given' }));
    };

    return;
  }

  setup() {
    let data = {
      seq: null,
      sessionID: null,
      heartbeatInterval: 0,
      ws: null,
      failed: 0,
      guilds: new Store(),
      latency: Infinity
    };

    for (var i of Object.entries(data)) {
      this[i[0]] = i[1];
    };

    return;
  }

  onMessage(packet) {
    switch(packet.op) {
      case 10:
        this.heartbeat(packet.d.heartbeat_interval)
        break;

      case 0:
        this.seq = packet.s;

        this.onEvent(packet);
        break;

      case 11:
        this.lastHeartbeatAck = new Date().getTime();
        this.latency = this.lastHeartbeatAck - this.lastHeartbeatSent;
        break;

      case 9:
        if (!packet.d) {
          this.client.emit('debug', { shard: this.id, message: 'Received Opcode 9 ( Invalid Session ). Will re-login.' });
          this.send({
            op: 2,
            d: {
              token: this.client.token,
              properties: {
                $os: process.platform,
                $browser: 'JCord',
                $device: 'JCord'
              },
              shard: [this.id, this.client.shardCount]
            }
          });
        } else {
          this.client.emit('debug', { shard: this.id, message: 'Received Opcode 9 ( Invalid Session ). Will resume.' });
          setTimeout(() => this.send({ op: 6, seq: this.seq, token: this.client.token, session_id: this.sessionID }), 2500);
        };

        break;

        case 7:
          this.client.emit('debug', { shard: this.id, message: 'Received Opcode 7 ( Reconnect ). Will reconnect the shard...' });
          this.disconnect(4000);

          this.ws = null;
          this.ws = new Websocket(this.client.gatewayURL);

          this.send({
            op: 2,
            d: {
              token: this.client.token,
              properties: {
                $os: process.platform,
                $browser: 'JCord',
                $device: 'JCord'
              },
              shard: [this.id, this.client.shardCount]
            }
          });
          break;
    };
  }

  onEvent(packet) {
    switch(packet.t) {
      case 'MESSAGE_CREATE':
        var channel = this.client.channels.get(packet.d.channel_id);
    
        if (!this.client.users.has(packet.d.author.id)) {
          this.client.users.set(packet.d.author.id, new User(this.client, packet.d.author));
        };

        let message = new Message(this.client, packet.d);

        if (this.client.storeMessages) {
          channel.messages.set(message.id, message)
        };
    
        this.client.emit('MESSAGE_CREATE', message);
        break;

      case 'CHANNEL_CREATE':
        var guild = this.client.guilds.get(packet.d.guild_id);
  
        switch(packet.d.type) {
          case 0: 
            guild.channels.set(packet.d.id, new TextChannel(this.client, packet.d));
            this.client.channels.set(packet.d.id, new TextChannel(this.client, packet.d));
            break;
  
          case 1:
            this.client.channels.set(packet.d.id, new DMChannel(this.client, packet.d));
            break;
  
          case 2:
            guild.channels.set(packet.d.id, new VoiceChannel(this.client, packet.d));
            this.client.channels.set(packet.d.id, new VoiceChannel(this.client, packet.d));
            break;
  
          case 4:
            guild.channels.set(packet.d.id, new CategoryChannel(this.client, packet.d));
            this.client.channels.set(packet.d.id, new CategoryChannel(this.client, packet.d));
            break;
        };
  
        this.client.emit('CHANNEL_CREATE', this.client.channels.get(packet.d.id));
        break;


      case 'READY':
        this.sessionID = packet.d.session_id;
        this.client.user = new ClientUser(this.client, packet.d.user);
        if (!packet.d.guilds.length) {
          this.client.connectedShards.set(this.id.toLocaleString(), this);
          this.client.shards.set(this.id.toString(), this);
          this.startTime = Date.now();

          /**
           * Emitted once a shard is ready
           * @event Client#SHARD_READY
           * @prop {Object} shard The data of the shard
           */
          this.client.emit('SHARD_READY', this);

          if (this.client.connectedShards.size === this.client.shardCount) {

            /**
             * Emiited once all shards are ready
             * @event Client#READY
             */
            this.client.emit('READY');
          }
        };

        this.guildLength = packet.d.guilds.length;
        
        break;

        case 'GUILD_CREATE':
          packet.d.shard = this;

          var guild = new Guild(this.client, packet.d);
          this.guilds.set(guild.id, guild);
          
          this.client.guilds.set(guild.id, guild);

          this.guildLength--;

          if (this.client.getAllMembers) {
            this.totalMemberCount += guild.memberCount;
            this.client.emit('debug', { shard: this.id, message: `Client#getAllMembers was true! Will request ALL guild members to be recevied and cached for Guild: ${guild.id}` });
            this.fetchAllMembers(packet.d.id);
          };

          if (this.guildLength == 0 && this.status !== 'ready' && !this.client.getAllMembers) {
            if (this.status === 'reconnecting') {
              this.startTime = Date.now();
              this.status = 'connected';
              this.client.connectedShards.set(this.id.toLocaleString(), this);
              return this.client.emit('SHARD_READY', (this));
            };
            
            this.client.startTime = Date.now();
            this.client.connectedShards.set(this.id.toLocaleString(), this);
            this.client.shards.set(this.id.toString(), this);
            this.startTime = Date.now();

            this.client.emit('SHARD_READY', this);

            if (this.client.connectedShards.size === this.client.shardCount) {
              this.status = 'ready';
              this.client.emit('READY');
            }
          };

          break;

        case 'GUILD_MEMBERS_CHUNK':
          var guild = this.client.guilds.get(packet.d.guild_id);

          for (var i = 0; i < packet.d.members.length; i++) {
            guild.members.set(packet.d.members[i].user.id, packet.d.members[i]);
            this.client.users.set(packet.d.members[i].user.id, new User(this.client, packet.d.members[i].user));
          };

          this.totalMemberCountOfGuildMemberChunk += packet.d.members.length;

          this.client.guilds.set(guild.id, guild);

          if (this.totalMemberCountOfGuildMemberChunk === this.totalMemberCount && this.status !== 'ready') {
            this.client.emit('SHARD_READY', this);
            this.startTime = Date.now();
            this.client.connectedShards.set(this.id.toLocaleString(), this);
            this.client.shards.set(this.id.toString(), this);

            if (this.client.connectedShards.size === this.client.shardCount) {
              this.client.startTime = Date.now();
              this.status = 'ready';
              this.client.emit('READY');
            }
          };  

          this.client.emit('GUILD_MEMBERS_CHUNK', packet.d);
          break;

        case 'GUILD_MEMBER_ADD':
          packet.d.guild = this.client.guilds.get(packet.d.guild_id);
          var member = new Member(this.client, packet.d);

          if (!this.client.users.has(member.user.id)) {
            this.client.users.set(member.user.id, new User(this.client, member.user));
          };

          packet.d.guild.members.set(member.user.id, member);

          /**
           * Emitted when a guild member joins a guild
           * @event Client#GUILD_MEMBER_ADD
           * @prop {Member} member The member that joined
           */
          this.client.emit('GUILD_MEMBER_ADD', member);
          break;

        case 'GUILD_MEMBER_REMOVE':
          var guild = this.client.guilds.get(packet.d.guild_id);

          if (!guild.members.has(packet.d.user.id)) {
            return this.client.emit('debug', { shard: this.id, message: 'Guild Member left, but not in cache. Will not emit Client#GUILD_MEMBER_ADD' });
          };

          var member = guild.members.get(packet.d.user.id);
          guild.members.delete(member.user.id);

          /**
           * Emitted when a guild member leaves a guild
           * @event Client#GUILD_MEMBER_REMOVE
           * @prop {Member} member The member that left
           */
          this.client.emit('GUILD_MEMBER_REMOVE', member);
          break;

        case 'GUILD_MEMBER_UPDATE':
          var guild = this.client.guilds.get(packet.d.guild_id);

          if (!guild.members.has(packet.d.user.id)) {
            guild.members.set(packet.d.user.id, new Member(this.client, packet.d));
          };

          var oldMember = guild.members.get(packet.d.user.id);
          var newMember = guild.members.set(packet.d.user.id, new Member(this.client, packet.d));

          if (packet.d.nick !== oldMember.nick) {
            newMember.nick = packet.d.nick;
            newMember = guild.members.set(packet.d.user.id, new Member(this.client, packet.d));
          };

          if (!packet.d.roles.includes(guild.id)) packet.d.roles.push(guild.id);
    
          if (packet.d.roles.length > newMember.roles.size) {
            var role = newMember.guild.roles.get(packet.d.roles[packet.d.roles.length - 2]);
    
            newMember.roles.set(role.id, role);
          };

          if (packet.d.roles.length < newMember.roles.size) {
            var oldRoleIDs = newMember.roles.keyArray();
            var removedRoles = oldRoleIDs.filter(val => !packet.d.roles.includes(val));
    
            removedRoles.forEach(role => {
              newMember.roles.delete(role);
            });
          };
          /**
           * Emitted when a guild gets updated
           * @event Client#GUILD_MEMBER_UPDATE
           * @prop {Member} oldMember The old data of the member that got updated
           * @prop {Member} newMember The new data of the member that got updated
           */
          this.client.emit('GUILD_MEMBER_UPDATE', oldMember, newMember);
          break;

        case 'PRESENCE_UPDATE':
          let data = {};

          if (packet.d.user.hasOwnProperty('avatar') && packet.d.user.hasOwnProperty('username') && packet.d.user.hasOwnProperty('discriminator')) {
            this.client.users.set(packet.d.user.id, new User(this.client, packet.d.user));
          };
    
          data.user = this.client.users.get(packet.d.user.id);
          data.status = packet.d.status;
          data.activities = packet.d.activities;
          data.game = packet.d.game || null

          /**
           * Emitted when a user changes his presence or user info
           * @event Client#PRESENCE_UPDATE
           * @prop {Object} data The data of the presence
           */
          this.client.emit('PRESENCE_UPDATE', data);
          break;

        case 'GUILD_ROLE_CREATE':
          var guild = packet.d.guild_id ? this.client.guilds.get(packet.d.guild_id) : null;
          guild.roles.set(packet.d.role.id, new Role(this.client, packet.d.role));
    
          /**
           * @event Client#GUILD_ROLE_CREATE
           * @prop {Role} role The new role created
           */
          this.client.emit('GUILD_ROLE_CREATE', new Role(this.client, packet.d.role));
          break;

        case 'GUILD_ROLE_DELETE':
          var guild = packet.d.guild_id ? this.client.guilds.get(packet.d.guild_id) : null;
          var role = guild.roles.get(packet.d.role_id);
          var members = guild.members.filter(member => member.roles.has(role.id));
    
          for (var i = 0; i < members.length; i++) {
            members[i].roles.delete(role.id);
          };
    
          guild.roles.delete(role.id);
    
          /**
           * @event Client#GUILD_ROLE_DELETE
           * @prop {Role} role The role deleted
           */
          this.client.emit('GUILD_ROLE_DELETE', role);
          break;

        case 'GUILD_ROLE_UPDATE':
          var guild = packet.d.guild_id ? this.client.guilds.get(packet.d.guild_id) : null;
          var role = new Role(this.client, packet.d.role);
          var members = guild.members.filter(member => member.roles.has(role.id));
    
          for (var i = 0; i < members.length; i++) {
            members[i].roles.set(role.id, role);
          };
    
          guild.roles.set(role.id, role);
          
          /**
           * @event Client#GUILD_ROLE_UPDATE
           * @prop {Role} role The role updated
           */
          this.client.emit('GUILD_ROLE_UPDATE', role);
          break;
      };

    return packet;
  }

  heartbeat(interval) {
    /**
     * Emitted once a Shard is being loaded
     * @event Client#SHARD_LOADING
     * @prop {Shard<Id>} shard Returns a partial Shard Object, contains an id only
     */
    this.client.emit('SHARD_LOADING', { id: this.id });
    this.lastHeartbeatSent = new Date().getTime();
    this.client.emit('debug', { shard: this.id, message: 'Sent the first heartbeat!'  });
    this.send({ op: 1, d: null });
    this.client.emit('debug', { shard: this.id, message: 'Sent Opcode 2 ( Identify ). Bot will now login' });
    this.send({
      op: 2,
      d: {
        token: this.client.token,
        properties: {
          $os: process.platform,
          $browser: 'JCord',
          $device: 'JCord'
        },
        shard: [this.id, this.client.shardCount],
        large_threshold: this.largeThreshold
      }
    });

    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeatSent = new Date().getTime();
      this.client.emit('debug', { shard: this.id, message: 'Sent another heartbeat!' });
      this.send({ op: 1, d: this.seq })
    }, interval);
    return;
  }

  send(data) {
    this.ws.send(typeof(data) === 'object' ? JSON.stringify(data) : data);
    return data;
  }

  fetchAllMembers(guilds) {
    return this.send({ op: 8, d: {
        guild_id: guilds,
        query: "",
        limit: 0
      }
    });
  }
};

module.exports = Shard;
