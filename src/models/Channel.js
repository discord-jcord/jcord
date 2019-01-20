const { CHANNEL_TYPES } = require('../utils/Constants');

/**
 * @class Represents a Channel
 * @prop {Snowflake} id The id of the channel
 * @prop {String} type The type of the channel
 * * `text` If the channel is a text channel
 * * `dm` If the channel is a dm channel
 * * `voice` If the channel is a voice channel
 * * `groupdm` If the channel is a group dm channel
 * * `category` if the channel is a Channel Category
 */

class Channel {
  constructor(client, data) {
    Object.defineProperty(this, 'client', { value: client });

    this.id = data.id;
    this.type = CHANNEL_TYPES[data.type];
  }

  toString() {
    return `<#${this.id}>`;
  }
};

module.exports = Channel;