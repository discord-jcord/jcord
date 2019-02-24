"use strict";

const BannedUser = require('./BannedUser');
const Store = require('../utils/Store');
const UnavailableGuild = require('./UnavailableGuild');
const TextChannel = require('./TextChannel');
const VoiceChannel = require('./VoiceChannel');
const CategoryChannel = require('./CategoryChannel');
const User = require('./User');
const Member = require('./Member');
const Role = require('./Role');
const { ENDPOINTS } = require('../utils/Constants').HTTP;

/**
 * @extends UnavailableGuild Represents an available guild on Discord
 * @prop {GuildChannel?} afkChannel Represents the afk Channel
 * @prop {Snowflake?} afkChannelID The id of the afk channel
 * @prop {Boolean} available Whether the guild is available or not
 * @prop {Store<GuildChannel>} channel A Store of the Channels in the Guild
 * @prop {Number} createdTimestamp The timestamp in ms when the guild was created
 * @prop {Number} defaultMessageNotificaions The default message notification for the Guild
 * @prop {Store<Emoji>} emojis A Store of Guild Emojis
 * @prop {Array} features An array of guild features
 * @prop {String?} icon The icon hash of the guild
 * @prop {String?} iconURL The url of the guild's icon
 * @prop {Snowflake} id The id of the guild
 * @prop {Boolean} large Whether the guild is large or not, depends on `Client.largeThreshold`
 * @prop {Number} memberCount The guilds's member count
 * @prop {Store<Member>} members The amount of Members that the guild is in
 * @prop {String} name The name of the guild
 * @prop {Member?} owner The member object of the guild owner
 * @prop {Member?} ownerID The id of the guild owner
 * @prop {Array} presences An array of member presence
 * @prop {String} region The region of the guild
 * @prop {Store<Role>} roles A Store of Roles ( Where Roles are cached )
 * @prop {Object?} systemChannel The system channel of the guild
 * @prop {Snowflake?} systemChannelID The id of the system channel
 */

class Guild extends UnavailableGuild {
  constructor(client, data) {
    super(client, data);
    Object.defineProperty(this, 'client', { value: client });
    Object.defineProperty(this, '_shard', { value: data.shard });

    this.afkChannelID = data.afk_channel_id;
    this.afkTimeout = data.afk_timeout;
    this.applicationID = data.application_id;
    this.channels = new Store();
    this.createdTimestamp = new Date(data.joined_at).getTime();
    this.defaultMessageNotificaions = data.default_message_notifications;
    this.emojis = new Store();
    this.explicitContentFilter = data.explicit_content_filter;
    this.features = data.features;
    this.icon = data.icon || null;
    this.iconURL = data.icon ? `https://cdn.discordapp.com/icons/${data.id}/${this.icon}.png` : null;
    this.large = data.large;
    this.lazy = data.lazy;
    this.memberCount = data.member_count;
    this.members = new Store();
    this.mfaLevel = data.mfa_level;
    this.name = data.name;
    this.ownerID = data.owner_id || null;
    this.presences = data.presences;
    this.region = data.region;
    this.roles = new Store();
    this.splash = data.splash;
    this.systemChannelID = data.system_channel_id;
    this.verificationLevel = data.verification_level;
    this.voiceStates = data.voice_states;
    
    Object.defineProperty(this, '_roleStatus', { value: false, writable: true });

    for (var i = 0; i < data.channels.length; i++) {
      data.channels[i].guild = this;
      switch(data.channels[i].type) {
        case 0: {
          this.channels.set(data.channels[i].id, new TextChannel(this.client, data.channels[i]));
          this.client.channels.set(data.channels[i].id, new TextChannel(this.client, data.channels[i]));
          break;
        }

        case 2: {
          this.channels.set(data.channels[i].id, new VoiceChannel(this.client, data.channels[i]));
          this.client.channels.set(data.channels[i].id, new VoiceChannel(this.client, data.channels[i]));
          break;
        }

        case 4: {
          this.channels.set(data.channels[i].id, new CategoryChannel(this.client, data.channels[i]));
          this.client.channels.set(data.channels[i].id, new CategoryChannel(this.client, data.channels[i]));
          break;
        }

        default: {
          this.client.emit('debug', 'Invalid Guild Channel type Received: ' + data.channels[i].type);
          break;
        }
      };
    };

    for (var i = 0; i < data.roles.length; i++) {
      this.roles.set(data.roles[i].id, new Role(this.client, data.roles[i]));
    };

    for (var i = 0; i < data.members.length; i++) {
      this.client.users.set(data.members[i].user.id, new User(this.client, data.members[i].user));
      data.members[i].guild = this;
      this.members.set(data.members[i].user.id, new Member(this.client, data.members[i]));
    };

    for (var i = 0; i < this.presences.length; i++) {
      this.client._presences.set(this.presences[i].user.id, { status: this.presences[i].status, game: this.presences[i].game });
    };
  }

  get afkChannel() {
    return this.afkChannelID ? this.channels.get(this.afkChannelID) : null;
  }

  get bans() {
    return (async () => {
      return await this.client.rest.request("GET", ENDPOINTS.GUILD_BANS(this.id)).data;
    })();
  }

  get bot() {
    return this.members.get(this.client.user.id);
  }

  get owner() {
    return this.ownerID ? this.members.get(this.ownerID) : null;
  }

  get shard() {
    return this._shard ? this._shard : this.client.shards.filter(shard => shard.guilds.has(this.id))[0];
  }

  get systemChannel() {
    return this.systemChannelID ? this.channels.get(this.systemChannelID) : null;
  }

  /**
   * Bans a member from the guild
   * @param {Snowflake} user The id of the member to ban
   * @param {Object} [options] Options for the guild ban
   * @param {Number} [options.days=0] Number of days to delete messages for
   * @param {String} [options.reason=''] Reasom for the ban
   * @returns {Promise<User>}
   */

  ban(user, options = { days: 0, reason: '' }) {
    return this.client.rest.request("PUT", `${ENDPOINTS.GUILD_BAN(this.id, user)}?delete-message-days=${options.days}&reason=${options.reason}`)
    .then(() => {
      return this.client.getUser(user);
    });
  }

  /**
   * Begins a prune operation. Returns an object with one 'pruned' key indicating the number of members that would be removed in a prune operation.
   * @param {Number} days Number of days to count prune for (1 or more)
   * @returns {Promise<Object>}
   */

  beginPrune(days) {
    return this.client.rest.request("POST", ENDPOINTS.GUILD_PRUNE(this.id), {
      data: {
        days
      }
    }).then(res => {
      return res.data;
    });
  }

  /**
   * Deletes a guild
   * @returns {Promise<Guild>}
   */

  delete() {
    return this.client.rest.request("DELETE", ENDPOINTS.GUILD(this.id))
    .then(() => {
      return this;
    });
  }

  /**
   * Deletes a role from the guild
   * @param {Snowflake} role The id of the role to delete
   * @returns {Promise<Role>}
   */

  deleteRole(role) {
    let Role = this.roles.get(role);

    return this.client.rest.request("DELETE", ENDPOINTS.GUILD_ROLE(this.id, role))
    .then(() => {
      return Role;
    });
  }

  /**
   * Gets information about the banned user id
   * @param {Snowflake} user The id of the banned user
   * @returns {Promise<BannedUser>}
   */

  getBan(user) {
    return this.client.rest.request("GET", ENDPOINTS.GUILD_BAN(this.guild, user))
    .then(res => {
      return new BannedUser(this.client, res.data);
    });
  }

  /**
   * Returns an array of banned users
   * @returns {Promise<Array<BannedUsers>>}
   */

  getBans() {
    return this.client.rest.request("GET", ENDPOINTS.GUILD_BANS(this.guild))
    .then(res => {
      return res.data.map(data => {
        return new BannedUser(this.client, data);
      });
    });
  }

  /**
   * Kicks a member from the guild
   * @param {Snowflake} user The id of the member to kick
   * @param {String} [reason] The reason for the kick
   * @returns {Promise<User>}
   */

  kick(user, reason) {
    return this.client.rest.request("DELETE", `${ENDPOINTS.GUILD_MEMBER(this.id, user)}?reason=${reason}`)
    .then(() => {
      return this.client.getUser(user);
    });
  }

  /**
   * Fetch all the guild channels using the REST API and sends an array of channels that were fetched from the cache
   * @returns {Promise<TextChannel|VoiceChannel|CategoryChannel>}
   */

  getChannels() {
    return this.client.rest.request("GET", ENDPOINTS.GUILD_CHANNELS(this.id))
    .then(res => {
      return res.data.map(channel => {
        return this.channels.get(channel.id);
      });
    });
  }

  /**
   * Returns an array of guild invites
   * @returns {Promise<Array<Invite>>}
   */

  getInvites() {
    return this.client.rest.request("GET", ENDPOINTS.GUILD_INVITES(this.id))
    .then(res => {
      return res.data;
    });
  }

  /**
   * Fetches a guild member from the cache, if not present will use the REST API and set it inside the cache
   * @param {Snowflake} user The id of the member
   * @returns {Promise<Member>}
   */

  getMember(user) {
    return this.client.rest.request("GET", ENDPOINTS.GUILD_MEMBER(this.id, user))
    .then(res => {
      if (!this.members.has(res.data.user.id)) {
        return this.members.set(res.data.user.id, new Member(this.client, res.data));
      } else {
        return this.members.get(res.data.user.id);
      }
    });
  }

  /**
   * Gives a member a role
   * @param {Snowflake} user The id of the member to give the role
   * @param {Snowflake} role The role to give to the member
   * @returns {Promise<Member>}
   */

  giveRole(user, role) {
    return this.client.rest.request("PUT", ENDPOINTS.GUILD_MEMBER_ROLE(this.id, user, role))
    .then(() => {
      return this.members.get(user);
    });
  }

  /**
   * Similiar to `Client#leaveGuild()`, makes the bot leave the current guild
   * @returns {Promise<Guild>}
   */

  async leave() {
    await this.client.leaveGuild(this.id);
    
    return Promise.resolve(this);
  }

  /**
   * Creates a Guild Channel
   * Guild Channel types:
   * * `text` - Text Channel
   * * `voice` - Voice Channel
   * * `category` - Category Channel
   * @param {String} name The name of the channel
   * @param {String} [type='text'] The type of the channel
   * @returns {Promise<TextChannel|VoiceChannel|CategoryChannel>}
   */

  makeChannel(name, type = 'text') {
    let types = ['text', 'voice', 'category'];

    if (typeof type !== 'string' || typeof type === 'string' && !types.includes(type.toLowerCase()))
      return this.client.emit('error', new Error('Invalid Channel type!'));

    type = type.toLowerCase();

    if (type === 'text') {
      type = 0;
    } else if (type === 'voice') {
      type = 2;
    } else if (type === 'category') {
      type = 4;
    }

    return this.client.rest.request("POST", ENDPOINTS.GUILD_CHANNELS(this.id), {
      data: {
        name,
        type
      }
    }).then(res => {
      if (this.channels.has(res.data.id)) {
        return this.channels.get(res.data.id);
      } else {
        let guild = this;
        res.data.guild = guild;

        switch (res.data.type) {
          case 0:
            guild.channels.set(res.data.id, new TextChannel(this.client, res.data));
            this.client.channels.set(res.data.id, new TextChannel(this.client, res.data));
            break;

          case 1:
          this.client.channels.set(res.data.id, new DMChannel(this.client, res.data));
            break;

          case 2:
            guild.channels.set(res.data.id, new VoiceChannel(this.client, res.data));
            this.client.channels.set(res.data.id, new VoiceChannel(this.client, res.data));
            break;

          case 4:
            guild.channels.set(res.data.id, new CategoryChannel(this.client, res.data));
            this.client.channels.set(res.data.id, new CategoryChannel(this.client, res.data));
            break;
        };

        return this.client.channels.get(res.data.id);
      };
    });
  }

  /**
   * Creates a guild role
   * @param {String} name The name of the role
   * @param {Boolean} [isHoisted=false] Whether the role should be seperate from the `@everyone` role
   * @param {Boolean} [isMentionable=false] Whther the role should be mentionable
   * @returns {Promise<Role>}
   */

  makeRole(name, isHoisted = false, isMentionable = false) {
    return this.client.rest.request("POST", ENDPOINTS.GUILD_ROLES(this.id), {
      data: {
        name,
        hoist: isHoisted,
        mentionable: isMentionable
      }
    }).then(res => {
      return this.roles.get(res.data.id);
    });
  }

  /**
   * Edits a channel's position
   * @param {Snowflake} channel The id of the channel to set the position of
   * @param {Number} position The new position of the channel
   * @returns {Promise<Channel>}
   */

  modifyChannelPosition(channel, position) {
    return this.client.rest.request("PATCH", ENDPOINTS.GUILD_CHANNEL(this.id, channel), {
      data: {
        id: channel,
        position
      }
    }).then(() => {
      return this.channels.get(channel);
    });
  }

  /**
   * Edits a guild role
   * @param {Snowflake} role The id of the role to edit
   * @param {Object} [options] The options for the role
   * @param {String} [options.name] The new name of the role
   * @param {Number} [options.color] The color of the role in RGB Form. e.g `(1, 1, 1)`
   * @param {Boolean} [options.isHoisted=false] Whether the role should be displayed separately in the sidebar
   * @param {Boolean} [options.isMentionable=false] Whether the role is mentionable
   * @returns {Promise<Role>}
   */

  modifyRole(role, options = {}) {
    return this.client.rest.request("PATCH", ENDPOINTS.GUILD_ROLE(this.id, role), {
      data: {
        name: options.name,
        color: options.color,
        hoist: options.isHoisted || false,
        mentionable: options.isMentionable || false
      }
    }).then(() => {
      return this.roles.get(role);
    });
  }

  /**
   * Returns an object with one 'pruned' key indicating the number of members that would be removed in a prune operation.
   * @param {Number} days Number of days to count prune for (1 or more)
   * @returns {Promise<Object>}
   */

  pruneCount(days) {
    return this.client.rest.request("GET", ENDPOINTS.GUILD_PRUNE(this.id), {
      data: {
        days
      }
    }).then(res => {
      return res.data;
    });
  }

  /**
   * Removes a role from a member
   * @param {Snowflake} user The id of the user to remove the role from
   * @param {Snowflake} role The id of the role to remove
   * @returns {Promise<Member>}
   */

  removeRole(user, role) {
    return this.client.rest.request("DELETE", ENDPOINTS.GUILD_MEMBER_ROLE(this.id, user, role))
    .then(() => {
      return this.members.get(user);
    });
  }

  /**
   * Edits a channel position
   * @param {Snowflake} channel The id of the guild channel
   * @param {Number} position The new position of the channel
   * @returns {Promise<TextChannel|VoiceChannel|GuildChannel>}
   */

  setChannelPosition(channel, position) {
    return this.client.rest.request("PATCH", ENDPOINTS.GUILD_CHANNELS(this.id), {
      data: {
        id: channel,
        position
      }
    }).then(() => {
      return this.channels.get(channel);
    });
  }

  /**
   * Sets the nickname of the client
   * @param {String} nick The new nickname for the bot
   * @returns {Promise<Member>}
   */

  setOwnNick(nick) {
    return this.client.rest.request("PATCH", ENDPOINTS.GUILD_MEMBER_NICK(this.id, '@me'), {
      data: {
        nick
      }
    }).then(() => {
      return this.bot;
    });
  }

  /**
   * Softbans a member from the guild
   * @param {Snowflake} user The id of the member to softban
   * @param {String} reason The reason for the softban
   * @returns {Promise<User>}
   */

  async softban(user, reason) {
    this.ban(user, { days: 7, reason });
    this.unban(user, reason);

    return await this.client.getUser(user);
  }

  /**
   * Unbans a member from the guild
   * @param {Snowflake} user The id of the member to unban
   * @param {String} reason The reason for the unban
   * @returns {Promise<User>}
   */

  unban(user, reason) {
    return this.client.rest.request("DELETE", `${ENDPOINTS.GUILD_BAN(this.id, user)}?reason=${reason}`)
    .then(() => {
      return this.client.getUser(user);
    });
  }
};

module.exports = Guild;