"use strict";

// models
const Message = require('../../models/Message');
const User = require('../../models/User');

/**
 * Emitted once a message is seen/sent
 * @event Client.MESSAGE_CREATE
 * @prop {Message} message
 */

class MessageCreate {
  constructor() {}

  emit(shard, packet) {
    if (!shard.client.users.has(packet.d.author.id)) {
      shard.client.users.set(packet.d.author.id, new User(shard.client, packet.d.author))
    }

    let message = new Message(shard.client, packet.d);

    shard.client.emit('MESSAGE_CREATE', message);
  }
};

module.exports = MessageCreate;