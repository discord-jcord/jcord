"use strict";

// models & utils
const Store = require('../utils/Store');
const User = require('./User');
const Permissions = require('../utils/Permissions');

/**
 * @class Represents a Guild Member
 * @prop {Boolean} bannable Whether or not the client can ban this member
 * @prop {Boolean} deaf Whether the member is deaf on a Voice Channel
 * @prop {Object} guild The guild the member is in
 * @prop {Number} joinedTimestamp The time the Member joined the guild in ms
 * @prop {Boolean} kickable Whether or not the client can kick this member
 * @prop {Boolean} muter Whether the member is muted
 * @prop {String?} nick The nickname of the member
 * @prop {Object} permissions The guild-wide permissions of the member
 * @prop {Store} roles The roles of the member
 * @prop {Object} user The user object of the member
 */

class Member {
  constructor(client, data) {
    Object.defineProperty(this, 'client', {
      value: client
    });

    this.deaf = Boolean(data.deaf);
    this.guild = data.guild ? data.guild : this.client.guilds.has(data.guild_id) ? this.client.guilds.get(data.guild_id) : this.client.emit('error', new Error('MEMBER found but no Guild!'));
    this.joinedTimestamp = new Date(data.joined_at).getTime();
    this.muted = Boolean(data.mute);
    this.nick = data.nick || null;
    this.roles = new Store();

    for (var i = 0; i < data.roles.length; i++) {
      let role = this.guild ? this.guild.roles.get(data.roles[i]) : this.client.emit('error', new Error('ROLE found but not Guild!'));
      if (role) this.roles.set(role.id, role);
    };

    if (!this.roles.has(this.guild.id)) {
      this.roles.set(this.guild.id, this.guild.roles.get(this.guild.id));
    };

    this.user = new User(this.client, data.user);
  }

  get bannable() {
    if (this.guild.ownerID === this.user.id) {
      return false;
    } else {
      if (!this.guild.bot.permissions.has('banMembers')) {
        return false;
      } else {
        let role_highest_position = {
          user: Math.max(...(this.roles.map(role => role.position))),
          bot: Math.max(...(this.guild.bot.roles.map(role => role.position)))
        };

        if (role_highest_position.user > role_highest_position.bot)
          return false;
        else
          return true;
      };
    };
  }

  get kickable() {
    if (this.guild.ownerID === this.user.id) {
      return false;
    } else {
      if (!this.guild.bot.permissions.has('kickMembers')) {
        return false;
    } else {
        let role_highest_position = {
          user: Math.max(...(this.roles.map(role => role.position))),
          bot: Math.max(...(this.guild.bot.roles.map(role => role.position)))
        };

        if (role_highest_position.user > role_highest_position.bot)
          return false;
        else
          return true;
      };
    };
  }

  get permissions() {
    return new Permissions(this.guild.ownerID === this.user.id ? 8 : this.roles.valueArray().reduce((acc, val) => acc | val.permissions, 0));
  }
};

module.exports = Member;
