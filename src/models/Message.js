/**
 * @class Represents a Discord Message
 * @prop {Array} attachments An array of message attachments
 * @prop {Object?} author The message author
 * @prop {Object} channel The channel the message was sent in
 * @prop {String} content The content of the message
 * @prop {Number?} createdTimestamp The time the message was created in ms
 * @prop {Number?} editedTimestamp The time the message was edited in ms
 * @prop {Array} embeds An array of message embeds
 * @prop {Snowflake} id The id of the message
 * @prop {Object?} member The user in member form
 * @prop {Boolean} mentionedEveryone Whether the content has the `@everyone` ping or `@here`
 * @prop {Array} roleMentions An array of role mentions
 * @prop {Array} mentions An array of user mentions
 * @prop {Boolean} pinned Whether the message is pinned
 * @prop {Boolean} tts Whether the message is tts (text-to-speach)
 * @prop {Number} type The type of the message
 */

class Message {
  constructor(client, data) {
    Object.defineProperty(this, 'client', { value: client });

    this.activity = data.activity || null;
    this.application = data.application || null;
    this.attachments = data.attachments;
    this.author = this.client.users.has(data.author.id) ? this.client.users.get(data.author.id) : this.client.users.set(data.author.id, data.author);
    this.channel = this.client.channels.get(data.channel_id) || this.client.emit('ERROR', new Error('Message Created but no Channel Received!'));
    this.content = data.content;
    this.createdTimestamp = new Date(data.timestamp).getTime();
    this.editedTimestamp = new Date(data.edited_timestamp).getTime() || null;
    this.embeds = data.embeds;
    this.id = data.id;
    this.mentionedEveryone = data.mention_everyone;
    this.mentions = data.mentions.map(user => {
      return this.client.users.get(user.id);
    });
    Object.defineProperty(this, '_mentionRoles', { value: data.mention_roles });
    this.pinned = data.pinned;
    this.tts = data.tts;
    this.type = data.type;
  }

  get channelMentions() {
    var channels = [];
    const regex = /<#(\d+)>/g;
    let result;

    while ((result = regex.exec(this.content)) !== null) {
      channels.push(this.client.channels.get(result[1]));
    } 

    return channels;
  }

  get member() {
    return this.channel.guild ? this.channel.guild.members.get(this.author.id) || null : null;
  }

  get roleMentions() {
    return this.channel.guild ? this._mentionRoles.map(role => {
      return this.channel.guild.roles.get(role);
    }) : [];
  }

  /**
   * Edits a message
   * @param {Object} options Options for the message editing
   * @param {String} options.content The content of the message
   * @param {Embed} options.embed The embed for the message
   * @returns {Promise<Message>}
   */

  patch(options = {}) {
    return this.channel.patchMessage(this.id, options);
  }

  toString() {
    return this.content;
  }
};

module.exports = Message;