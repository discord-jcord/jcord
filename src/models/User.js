const { ENDPOINTS } = require('../utils/Constants').HTTP;

/**
 * @class Represents a User
 * @prop {String?} avatar The avatar hash of the user
 * @prop {String} avatarURL The url of the user's avatar
 * @prop {Boolean} bot Whether the user is a bot or not
 * @prop {Number} createdTimestamp Timestamp of when the user account was created
 * @prop {String} discriminator The discriminator of the user
 * @prop {Snowflake} id The id of the user
 * @prop {String} tag The tag of the user
 * @prop {String} username The username of the user
 */

class User {
  constructor(client, data) {
    Object.defineProperty(this, 'client', { value: client });

    this.avatar = data.avatar || null;
    this.avatarURL = this.avatar ? (this.avatar.startsWith('a_') ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.gif` : `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`) : `https://cdn.discordapp.com/embed/avatars/${data.discriminator % 5}.png`;
    this.bot = Boolean(data.bot);
    this.discriminator = data.discriminator;
    this.id = data.id;
    this.mention = `<@${this.id}>`;
    this.tag = `${data.username}#${this.discriminator}`;
    this.username = data.username;
  }

  get createdTimestamp() {
    return new Date((this.id / 4194304) + 1420070400000).getTime()
  }

  get presence() {
    if (!this.client._presences.has(this.id)) {
      return this.client._presences.set(this.id, { status: 'offline', game: null });
    } else {
      return this.client._presences.get(this.id);
    };
  }

  /**
   * Similar to `Client#createDM()`
   * @returns {Promise<DMChannel>}
   */

  createDM() {
    return this.client.createDM(this.id);
  }

  /**
   * Sends an embed to the user
   * @param {Object} embed The embed to send
   * @returns {Promise<Message>}
   */

  async createEmbed(embed) {
    let channel = await this.createDM();

    return this.client.createEmbed(channel.id, embed);
  }

  /**
   * Sends a message to the user
   * @param {String} content The content of the message
   * @returns {Promise<Message>}
   */

  async createMessage(content) {
    let channel = await this.createDM();

    return this.client.createMessage(channel.id, content);
  }

  toString() {
    return this.mention;
  }
};

module.exports = User;