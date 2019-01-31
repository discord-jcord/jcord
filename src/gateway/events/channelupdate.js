"use strict";

// models
const TextChannel = require('../../models/TextChannel')
const VoiceChannel = require('../../models/VoiceChannel');
const DMChannel = require('../../models/DMChannel');
const CategoryChannel = require('../../models/CategoryChannel');

/**
 * Emitted once a channel gets updated
 * @event Client.CHANNEL_UPDATE
 * @prop {DMChannel|TextChannel|VoiceChannel|CategoryChannel} oldChannel The old data of the channel ( Not Cached )
 * @prop {DMChannel|TextChannel|VoiceChannel|CategoryChannel} newChannel The new data of the channel
 */

class ChannelUpdate {
  constructor() {}
  
  emit(shard, packet) {
    let guild = packet.d.guild_id ? shard.client.guilds.get(packet.d.guild_id) : null;
    packet.d.guild = guild;
    let newChannel;
    let oldChannel = shard.client.channels.get(packet.d.id);

    switch (packet.d.type) {
      case 0:
        guild.channels.set(packet.d.id, new TextChannel(shard.client, packet.d));
        newChannel = shard.client.channels.set(packet.d.id, new TextChannel(shard.client, packet.d));
        break;

      case 1:
        newChannel = shard.client.channels.set(packet.d.id, new DMChannel(shard.client, packet.d));
        break;

      case 2:
        guild.channels.set(packet.d.id, new VoiceChannel(shard.client, packet.d));
        newChannel = shard.client.channels.set(packet.d.id, new VoiceChannel(shard.client, packet.d));
        break;

      case 4:
        guild.channels.set(packet.d.id, new CategoryChannel(shard.client, packet.d));
        newChannel = shard.client.channels.set(packet.d.id, new CategoryChannel(shard.client, packet.d));
        break;
    };

    shard.client.emit('CHANNEL_UPDATE', oldChannel, newChannel);
  }
};

module.exports = ChannelUpdate;