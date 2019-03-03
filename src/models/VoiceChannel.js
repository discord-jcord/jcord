const GuildChannel = require('./GuildChannel');

/**
 * @extends GuildChannel Represents a guild voice channel
 * @prop {Number} createdTimestamp Timestamp of when the channel was created
 * @prop {Number?} bitrate The bitrate (in bits) of the voice channel
 * @prop {Number?} userLimit The amount of members allowed to join the voice channel
 * @prop {Snowflake?} parentID The id of the category the channel is in
 * @prop {Object?} parent The category the channel is in
 */

class VoiceChannel extends GuildChannel {
  constructor(client, data) {
    super(client, data);
    Object.defineProperty(this, 'client', { value: client });

    this.bitrate = data.bitrate;
    this.parentID = data.parent_id || null;
    this.userLimit = data.user_limit;
  }

  get parent() {
    return this.parentID ? this.client.channels.get(this.parentID) : null;
  }
};

module.exports = VoiceChannel;