"use strict";

// models
const TextChannel = require('../../models/TextChannel')
const VoiceChannel = require('../../models/VoiceChannel');
const DMChannel = require('../../models/DMChannel');
const CategoryChannel = require('../../models/CategoryChannel');

/**
 * Emitted once a channel has been created
 * @event Client.CHANNEL_CREATE
 * @prop {TextChannel|VoiceChannel|CategoryChannel|DMChannel}
 */

class ChannelCreate {
  constructor() {}

  emit(shard, packet) {
    let guild = shard.client.guilds.get(packet.d.guild_id);
    packet.d.guild = guild;

    switch (packet.d.type) {
      case 0:
        guild.channels.set(packet.d.id, new TextChannel(shard.client, packet.d));
        shard.client.channels.set(packet.d.id, new TextChannel(shard.client, packet.d));
        break;

      case 1:
        shard.client.channels.set(packet.d.id, new DMChannel(shard.client, packet.d));
        break;

      case 2:
        guild.channels.set(packet.d.id, new VoiceChannel(shard.client, packet.d));
        shard.client.channels.set(packet.d.id, new VoiceChannel(shard.client, packet.d));
        break;

      case 4:
        guild.channels.set(packet.d.id, new CategoryChannel(shard.client, packet.d));
        shard.client.channels.set(packet.d.id, new CategoryChannel(shard.client, packet.d));
        break;
    };

    shard.client.emit('CHANNEL_CREATE', shard.client.channels.get(packet.d.id));
  }
};

module.exports = ChannelCreate