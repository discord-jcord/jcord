"use strict";

// models
const User = require('../../models/User');
const Member = require('../../models/Member');

/**
 * Emits once a user joins a guild
 * @event Client.GUILD_MEMBER_ADD
 * @prop {Member} member The member object that joined
 * @prop {Guild} guild The guild the member joined
 */

class GuildMemberAdd {
  constructor() {}

  emit(shard, packet) {
    if (!packet.d.guild_id) return shard.client.emit('error', new Error('NEW MEMBER ON GUILD BUT NO GUILD FOUND!'));

    if (!shard.client.users.has(packet.d.user.id)) {
      shard.client.users.set(packet.d.user.id, new User(shard.client, packet.d.user));
    };

    let guild = shard.client.guilds.get(packet.d.guild_id);
    guild.memberCount++;

    packet.d.guild = guild;
    let member = guild.members.set(packet.d.user.id, new Member(shard.client, packet.d));

    shard.client.guilds.set(guild.id, guild);
    shard.client.emit('GUILD_MEMBER_ADD', member, guild);
  }
};

module.exports = GuildMemberAdd;