"use strict";

/**
 * Emitted once a role is deleted, this also emits one or multiple `Client#GUILD_MEMBER_UPDATE`
 * @event Client.ROLE_DELETE
 * @prop {Role} role The deleted role
 */

class RoleDelete {
  constructor() {}

  emit(shard, packet) {
    if (!packet.d.guild_id) return shard.client.emit('error', new Error('ROLE DELETED BUT NO GUILD FOUND!'));

    let guild = shard.client.guilds.get(packet.d.guild_id);
    
    // If no guild was found, we should not emit this event since it means that the bot left the guild
    if (!guild)
      return;

    let role = guild.roles.get(packet.d.role_id);

    guild.roles.delete(role.id);

    shard.client.emit('ROLE_DELETE', role);
  }
};

module.exports = RoleDelete;