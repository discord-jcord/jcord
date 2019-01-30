"use strict";

// models
const Message = require('../../models/Message');

/**
 * Emitted once a message is seen/sent
 * @event Client.MESSAGE_CREATE
 * @prop {Message} message
 */

class MessageCreate {
  constructor() {}

  async emit(shard, packet) {
    if (!shard.client.users.has(packet.d.author.id)) {
      await shard.client.getUser(packet.d.author.id);
    }

    if (packet.d.guild_id) {
      let guild = shard.client.guilds.get(packet.d.guild_id);

      if (!guild.members.has(packet.d.author.id))
        await guild.getMember(packet.d.author.id);
    }

    let message = new Message(shard.client, packet.d);

    shard.client.emit('MESSAGE_CREATE', message);
  }
};

module.exports = MessageCreate;