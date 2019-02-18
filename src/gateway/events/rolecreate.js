"use strict";

// models
const Role = require('../../models/Role');

/**
 * Emitted once a role is created
 * @event Client.ROLE_CREATE
 * @prop {Role} role The role that was created
 */

class RoleCreate {
  constructor() {}

  emit(shard, packet) {
    if (!packet.d.guild_id) return shard.client.emit('error', new Error('ROLE CREATED BUT NO GUILD FOUND!'));

    let role = new Role(shard.client, packet.d.role);
    role.guild = shard.client.guilds.get(packet.d.guild_id);

    role.guild.roles.set(role.id, role);

    shard.client.emit('ROLE_CREATE', role);
  }
};

module.exports = RoleCreate;