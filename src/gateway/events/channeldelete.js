"use strict";

/**
 * Emitted once a channel gets deleted
 * @event Client.CHANNEL_DELETE
 * @prop {DMChannel|TextChannel|VoiceChannel|CategoryChannel} channel The channel that got deleted
 */

class ChannelDelete {
  constructor() {}

  emit(shard, packet) {
    let channel = shard.client.channels.get(packet.d.id);

    if (channel.guild) {
      // For Guild Channels
      channel.guild.channels.delete(packet.d.id);
      shard.client.channels.delete(packet.d.id);
    } else {
      // For DM Channels
      shard.client.channels.delete(packet.d.id);
    };

    shard.client.emit('CHANNEL_DELETE', channel);
  }
};

module.exports = ChannelDelete;