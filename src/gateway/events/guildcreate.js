"use strict";

// models
const Guild = require('../../models/Guild');

/**
 * Emitted once a guild becomes available or when a bot joins a guild
 * @event Client.GUILD_CREATE
 * @prop {Guild} guild The guild that became available
 */

class GuildCreate {
  constructor() {}

  emit(shard, packet) {
    shard.guildLength--;

    let guild = new Guild(shard.client, packet.d);

    // Set the guild to cache
    shard.client.guilds.set(guild.id, guild);

    // Set the guild to the shard cache
    shard.guilds.set(guild.id, guild);

    if (shard.client.getAllMembers) {
      shard.totalMemberCount += guild.memberCount;

      // Debugger #1
      shard.client.emit('debug', { shard: shard.id, message: `Client#getAllMembers was true! Will cache all members on Guild: ${guild.id}` });
      
      shard.fetchAllMembers(packet.d.id);
    };

    if (shard.guildLength === 0 && shard.status !== 'ready' && !shard.client.getAllMembers) {
      if (shard.status === 'reconnecting') {
        shard.startTime = Date.now();
        shard.status = 'ready';
        shard.client.connectedShards.set(shard.id, shard);
        shard.client.shards.set(shard.id, shard);
        shard.client.emit('SHARD_READY', shard);

        return;
      }

      shard.startTime = Date.now();
      shard.client.connectedShards.set(shard.id, shard);
      shard.client.shards.set(shard.id, shard);
      shard.status = 'ready';

      shard.client.emit('SHARD_READY', shard);

      if (shard.client.connectedShards.size === shard.client.shardCount) {
        shard.client.status = 'ready';
        shard.client.emit('READY');
      }
    };
  }
};

module.exports = GuildCreate;