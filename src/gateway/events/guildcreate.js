"use strict";

// models
const Guild = require('../../models/Guild');

class GuildCreate {
  constructor() {}

  emit(shard, packet) {
    packet.d.shard = shard;
    let guild = new Guild(shard.client, packet.d);

    // This variable will check if it is a new guild or a guild became available
    let new_guild;

    // If the guild cache doesn't contain the guild id ( if it's in the cache, then a guild became available, if not it is a new one )
    if (!shard.client.guilds.has(packet.d.id))
      new_guild = true;
    else
      new_guild = false;

    // Set the guild to cache
    shard.client.guilds.set(guild.id, guild);

    // Set the guild to the shard cache
    shard.guilds.set(guild.id, guild);

    shard.guildLength--;  
    
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

        shard.guilds.forEach(guild => {
          packet.d.shard = null;
          let _Guild = new Guild(shard.client, packet.d);

          shard.guilds.set(_Guild.id, _Guild);
          shard.client.guilds.set(_Guild.id, _Guild);
        });

        shard.client.emit('SHARD_READY', shard);

        return;
      }

      shard.startTime = Date.now();
      shard.client.connectedShards.set(shard.id, shard);
      shard.client.shards.set(shard.id, shard);
      shard.status = 'ready';

      /**
       * Emitted once a Shard becomes ready
       * @event Client.SHARD_READY
       * @prop {Shard} shard The data of the shard
       */

      shard.client.emit('SHARD_READY', shard);

      if (shard.client.connectedShards.size === shard.client.shardCount) {
        shard.client.startTime = Date.now();
        shard.client.status = 'ready';
        return shard.client.emit('READY');
      }
    };

    /**
     * Emitted once a guild becomes available
     * @event Client.GUILD_AVAILABLE
     * @prop {Guild} guild The guild that became available
     */

    /**
     * Emitted once a bot joins a guild
     * @event Client.GUILD_CREATE
     * @prop {Guild} guild The guild that became available
     */

    return new_guild ? shard.client.emit('GUILD_CREATE', guild) : shard.client.emit('GUILD_AVAILABLE', guild)
  }
};

module.exports = GuildCreate;