"use strict";

// models & utils
const Channel = require('./Channel');
const { ENDPOINTS } = require('../utils/Constants').HTTP;
const { PERMISSIONS } = require('../utils/Constants');
const Permissions = require('../utils/Permissions');
const Store = require('../utils/Store');

/**
 * @extends Channel Represents a Guild Channel
 * @prop {Number} createdTimestamp Timestamp of when the channel was created
 * @prop {Guild} guild The guild the channel is in
 * @prop {Snowflake} id The id of the guild channel
 * @prop {String} name The name of the guild channel
 * @prop {Array} permissionOverwrites An array of Permission Overwrites for the channel
 * @prop {Number} position The position of the Channel
 * @prop {String} type The type of the channel
 * * `text` If the channel is a text channel
 * * `dm` If the channel is a dm channel
 * * `voice` If the channel is a voice channel
 * * `groupdm` If the channel is a group dm channel
 * * `category` if the channel is a Channel Category
 */

class GuildChannel extends Channel {
  constructor(client, data) {
    super(client, data);
    Object.defineProperty(this, 'client', { value: client });
    
    this.guild = data.guild;
    this.name = data.name;
    this.nsfw = data.nsfw;
    this.permissionOverwrites = data.permission_overwrites;
    this.position = data.position;
  }

  /**
   * Edits the channel permission for the user or role
   * @param {Snowflake} userOrRole The id of the user or role
   * @param {Object} [options] Options for the permission change
   * @param {String} [options.allow] The name of the permission to allow for the role or user
   * @param {String} [options.deny] The name of the permission to deny for the role or user 
   * @param {String} [options.type] "member" for a user or "role" for a role
   * @returns {Promise<Member|Role>}
   */

  changePermissions(userOrRole, options = {}) {
    if (options.allow && PERMISSIONS.hasOwnProperty(options.allow)) {
      options.allow = PERMISSIONS[options.allow];
    };

    if (options.deny && PERMISSIONS.hasOwnProperty(options.deny)) {
      options.deny = PERMISSIONS[options.deny];
    };

    if (options.type)
      options.type = options.type.toLowerCase();

    return this.client.rest.request("PUT", ENDPOINTS.CHANNEL_PERMISSION(this.id, userOrRole), {
      data: {
        allow: options.allow,
        deny: options.deny,
        type: options.type
      }
    }).then(() => {
      if (options.type.toLowerCase() === 'member') {
        return this.guild ? this.guild.members.get(userOrRole) : null;
      } else if (options.type.toLowerCase() === 'role') {
        return this.guild ? this.guild.roles.get(userOrRole) : null;
      }
    }); 
  }

  /**
   * Checks a certain permission for a member in a Guild Channel
   * * This function is still in testing and might not work. ( Small Chance of not working )
   * @param {Snowlake} memberID The id of the member
   * @param {String} permissionName The name of the permission to check
   * @returns {Boolean}
   */

  permissionsFor(memberID, permissionName) {
    let member = this.guild.members.get(memberID);
    let permissions = this.client.permissions.get(permissionName);

    // If the member has administrator permissions, return true since administrator overrides any Channel overwrite 
    if (member.permissions.has('administrator')) return true;

    // Overwrites cache
    let overwrites = new Store();

    for (var i = 0; i < this.permissionOverwrites.length; i++) {
      overwrites.set(this.permissionOverwrites[i].id, this.permissionOverwrites[i]);
    };

    // Role Specific Overwrites
    let roleIDs = member.roles.keyArray()
    let perm_allow = 0;
    let perm_deny = 0;

    for (var roleID in roleIDs) {
      let role = overwrites.get(roleIDs[roleID]);

      if (role) {
        perm_allow |= role.allow;
        perm_deny |= role.deny;
      };
    };

    permissions |= perm_allow;
    permissions &= ~perm_deny;

    // Member specific Overwrites
    let overwrite_member = overwrites.get(member.user.id);
    if (overwrite_member) {
      permissions &= ~overwrite_member.deny;
      permissions |= overwrite_member.allow;
    }

    return new Permissions(permissions).has(permissionName);
  }

  /**
   * Creates an invite for the guild channel
   * @param {Object} [options] Options for creating the invite
   * @param {Number} [options.maxAge=86400] Duration of invite in seconds, or 0 for never
   * @param {Number} [options.maxUses=0] Maximum uses for the invite, or 0 for unlimited
   * @param {Boolean} [options.temporary=false] Whether this invite should be temporary
   * @param {Boolean} [options.unique=] If true, don't try to reuse a similar invite
   * @returns {Promise<Invite>}
   */

  createInvite(options = { maxAge: 86400, maxUses: 0, temporary: false, unique: false }) {
    return this.client.rest.request("POST", ENDPOINTS.CHANNEL_INVITES(this.id), {
      data: {
        max_age: options.maxAge,
        max_uses: options.maxUses,
        temporary: options.temporary,
        unique: options.unique
      }
    }).then(res => {
      return res.data;
    });
  }

  /**
   * Similar to `GuildChannel#delete`.
   * Closes a channel
   * @returns {Promise<TextChannel|VoiceChannel|CategoryChannell>}
   */

  delete() {
    this.close();
  }

  /**
   * Edits the channel
   * @param {String} [name] The new name of the channel
   * @param {Number} [position] The new position of the channel
   * @returns {Promise<TextChannel|VoiceChannel|CategoryChannel>}
   */

  edit(name, position) {
    if (!name) name = this.name;
    if (!position) position = this.position;
    return this.client.rest.request("PATCH", ENDPOINTS.CHANNEL(this.id), {
      data: {
        name,
        position,
      }
    }).then(() => {
      return this;
    });
  }

  /**
   * Returns an array of Channel Invites
   * @returns {Promise<Array<Invite>>}
   */

  getInvites() {
    return this.client.rest.request("GET", ENDPOINTS.CHANNEL_INVITES(this.id))
    .then(res => {
      return res.data;
    });
  }
};

module.exports = GuildChannel;