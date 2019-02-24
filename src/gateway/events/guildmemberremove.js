"use strict";

/**
 * Emits once a user leaves a guild
 * @event Client.GUILD_MEMBER_REMOVE
 * @prop {Member} member The member object that left
 * @prop {Guild} guild The guild the member left
 */

class GuildMemberRemove {
  constructor() {}

  emit(shard, packet) {
    if (!packet.d.guild_id) return shard.client.emit('error', new Error('MEMBER LEFT GUILD BUT NO GUILD FOUND!'));

    let guild = shard.client.guilds.get(packet.d.guild_id);

    // If no guild was found, we should not emit this event since it means that the bot left the guild
    if (!guild)
      return;
      
    let member = guild.members.get(packet.d.user.id);

    guild.memberCount--;
    guild.members.delete(packet.d.user.id);

    shard.client.guilds.set(guild.id, guild);

    shard.client.emit('GUILD_MEMBER_REMOVE', member, guild);
  }
};

module.exports = GuildMemberRemove;