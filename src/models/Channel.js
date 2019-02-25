const { CHANNEL_TYPES } = require('../utils/Constants');

/**
 * @class Represents a Channel
 * @prop {Number} createdTimestamp Timestamp of when the channel was created
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
    this.mention = `<#${this.id}>`;
    this.type = CHANNEL_TYPES[data.type];
  }

  get createdTimestamp() {
    return new Date((this.id / 4194304) + 1420070400000).getTime()
  }

  /**
   * Closes a channel
   * @returns {Promise<DMChannel|TextChannel|VoiceChannel|CategoryChannel>}
   */

  close() {
    return this.client.rest.request("DELETE", ENDPOINTS.CHANNEL(this.id))
    .then(() => {
      return this;
    });
  }

  toString() {
    return this.mention;
  }
};

module.exports = Channel;