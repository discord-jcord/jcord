"use strict";

// models & utils
const Permissions = require('../../utils/Permissions');
const Role = require('../../models/Role');

/**
 * Emitted once a role gets updated
 * @event Client.ROLE_UPDATE
 * @prop {Role} oldRole The old role data
 * @prop {Role} role The new role data
 */

class RoleUpdate {
  constructor() {}

  emit(shard, packet) {
    if (!packet.d.guild_id) return shard.client.emit('error', new Error('ROLE UPDATED BUT NO GUILD FOUND!'));

    let guild = shard.client.guilds.get(packet.d.guild_id);
    let oldRole = guild.roles.get(packet.d.role.id);
    let role = new Role(shard.client, packet.d.role);
    let members = guild.members.filter(member => member.roles.has(role.id));

    for (var i = 0; i < members.length; i++) {
      members[i].roles.set(role.id, role);
    };

    guild.roles.set(role.id, role);

    if (oldRole === role) return;

    shard.client.emit('ROLE_UPDATE', oldRole, role);
  }
};

module.exports = RoleUpdate;