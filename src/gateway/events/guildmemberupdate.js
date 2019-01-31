"use strict";

const Store = require('../../utils/Store');

/**
 * Emits once a user joins a guild
 * @event Client.GUILD_MEMBER_UPDATE
 * @prop {Member} member The new member data ( Cached )
 * @prop {Member} oldMember The old member data ( Partial, not cached )
 * @prop {String?} oldMember.nick The old nickname of the member
 * @prop {Store} oldMember.roles The old roles of the member
 */

class GuildMemberUpdate {
  constructor() {}

  async emit(shard, packet) {
    if (!packet.d.guild_id) return shard.client.emit('error', new Error('GUILD MEMBER UPDATED BUT MISSING GUILD!'));

    let guild = shard.client.guilds.get(packet.d.guild_id);
    let member = guild.members.get(packet.d.user.id);
    let oldMember = null;

    if (member) {
      oldMember = {
        roles: member.roles,
        nick: member.nick
      }
    }

    // Roles handler
    let roles = new Store();

    for (var i = 0; i < packet.d.roles.length; i++) {
      roles.set(packet.d.roles[i], guild.roles.get(packet.d.roles[i]));
    };

    if (!roles.has(guild.id)) {
      roles.set(guild.roles.get(guild.id).id, guild.roles.get(guild.id));
    };
  
    if (member) {
      member.nick = packet.d.nick;
      member.roles = roles;
    }

    member = guild.members.set(packet.d.user.id, member);

    shard.client.emit('GUILD_MEMBER_UPDATE', oldMember, member);
  }
};

module.exports = GuildMemberUpdate;