"use strict";

// models
const ClientUser = require('../../models/ClientUser');
const UnavailableGuild = require('../../models/UnavailableGuild');

/**
 * Emitted once all Shards are ready
 * @event Client.READY
 */

class Ready {
  constructor() {}

  emit(shard, packet) {
    shard.client.user = new ClientUser(shard.client, packet.d.user);
    shard.sessionID = packet.d.session_id;

    for (var i = 0; i < packet.d.guilds.length; i++) {
      shard.client.guilds.set(packet.d.guilds[i].id, new UnavailableGuild(this.client, packet.d.guilds[i]));
    };

    if (packet.d.guilds.length == 0) {
      
      shard.status = 'ready';
      shard.client.shards.set(shard.id, shard);
      shard.client.connectedShards.set(shard.id, shard);

      // Emit a SHARD_READY event
      shard.client.emit('SHARD_READY', shard);

      if (shard.client.connectedShards.size === shard.client.shardCount && shard.client.status !== 'ready') {

        shard.client.status = 'ready';

        // Emit a READY event
        return shard.client.emit('READY');
      }
    };

    shard.guildLength = packet.d.guilds.length;
  }
};

module.exports = Ready;