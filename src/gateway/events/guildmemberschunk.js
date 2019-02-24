"use strict";

// models
const User = require('../../models/User');
const Member = require('../../models/Member');

/**
 * Emitted when a guild requests all members to be fetched
 * @event Client.GUILD_MEMBERS_CHUNK
 * @prop {Guild} guild The guild that requested for all members to be fetced
 */

class GuildMembersChunk {
  constructor() {}

  emit(shard, packet) {
    let guild = shard.client.guilds.get(packet.d.guild_id);

    for (var i = 0; i < packet.d.members.length; i++) {
      packet.d.members[i].guild = guild;

      guild.members.set(packet.d.members[i].user.id, new Member(shard.client, packet.d.members[i]));
      shard.client.users.set(packet.d.members[i].user.id, new User(shard.client, packet.d.members[i].user));
    };

    shard.totalMemberCountOfGuildMemberChunk += packet.d.members.length;

    shard.client.guilds.set(guild.id, guild);

    if (shard.totalMemberCountOfGuildMemberChunk === shard.totalMemberCount && shard.status !== 'ready') {
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
        shard.client.startTime = Date.now();
        shard.client.status = 'ready';
        shard.client.emit('READY');
      };
    };

    shard.client.emit('GUILD_MEMBERS_CHUNK', guild);
  }
};

module.exports = GuildMembersChunk;