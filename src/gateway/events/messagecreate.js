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

  emit(shard, packet) {
    let message = new Message(shard.client, packet.d);

    shard.client.emit('MESSAGE_CREATE', message);
  }
};

module.exports = MessageCreate;