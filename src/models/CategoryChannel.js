const GuildChannel = require('./GuildChannel');

/**
 * @extends GuildChannel Represents a channel category
 * @prop {Number} createdTimestamp Timestamp of when the channel was created
 * @prop {Array?} children Returns an array of channels that has the category as it's parent
 */

class CategoryChannel extends GuildChannel {
  constructor(client, data) {
    super(client, data);
    Object.defineProperty(this, 'client', { value: client });
  }

  get children() {
    return this.guild.channels.filter(channel => channel.parentID === this.id);
  }
};

module.exports = CategoryChannel;