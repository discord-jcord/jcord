"use strict";

const Message = require('../models/Message');
const GuildChannel = require('./GuildChannel');
const { ENDPOINTS } = require('../utils/Constants').HTTP;
const Store = require('../utils/Store');

/**
 * @extends GuildChannel Represens a Guild Text Channel.
 * @prop {Number} createdTimestamp Timestamp of when the channel was created
 * @prop {Number} rateLimitPerUser Amount of seconds a user has to wait before sending another message (0-120); bots, as well as users with the permission `manage_messages` or `manage_channel`, are unaffected
 * @prop {String?} topic The topic of the text channel.
 * @prop {Snowflake?} lastMessageID The id of the last message sent
 * @prop {String} mention The mention for the channel
 * @prop {Store?} messages The messages of the channel stored in the cache.
 * @prop {Snowflake?} parentID The id of the category the channel is in
 * @prop {Object?} parent The category the channel is in
 */

class TextChannel extends GuildChannel {
  constructor(client, data) {
    super(client, data);
    Object.defineProperty(this, 'client', { value: client });

    this.rateLimitPerUser = data.rate_limit_per_user;
    this.topic = data.topic || null;
    this.lastMessageID = data.last_message_id || null;
    this.messages = new Store();
    this.parentID = data.parent_id || null;
  }

  get parent() {
    return this.parentID ? this.client.channels.get(this.parentID) : null;
  }

  /**
   * Creates an embed to the channel
   * @deprecated Use TextChannel#send() instead
   * @param {Object} embed The embed to send
   * @returns {Promise<Message>}
   */

  createEmbed(embed) {
    return this.client.createEmbed(this.id, embed);
  }

  /**
   * Creates a message to the channel
   * @deprecated Use TextChannel#send() instead
   * @param {String} content The content of the message
   * @returns {Promise<Message>}
   */

  createMessage(content) {
    return this.client.createMessage(this.id, content);
  }

  /**
   * Add a reaction to a message
   * @param {Snowflake} message The id of the message to add a reaction to
   * @param {String} emoji The unicode of the emoji or for custom emojis, use `name:id`
   * * For emojis that aren't custom, you need to get their unicode by doing: \:emojiname:
   * for example, \:thinking: will give '🤔', then use it to react. While for customs, just do `name:id`
   * @returns {Promise<Message>}
   */

  async createReaction(message, emoji) {
    await this.client.rest.request("PUT", ENDPOINTS.CHANNEL_REACTION(this.id, message, encodeURI(emoji), '@me'));

    let msg = await this.getMessage(message);
    return msg;
  }

  /**
   * Fetch a single message
   * If `Client#storeMessages` is true, it will try to fetch the message in the cache. And if it failed
   * it would fetch the message through Discord's REST API And set it in the cache.
   * Otherwise, if it's false, it would just fetch the message through Discord's REST API
   * @param {Snowflake} message The id of the message to fetch
   * @returns {Promise<Message>}
   */

  getMessage(message) {
    if (this.client.storeMessages) {
      if (!this.messages.has(message)) {
        return this.client.rest.request("GET", ENDPOINTS.CHANNEL_MESSAGE(this.id, message))
        .then(res => {
          return this.messages.set(res.data.id, new Message(this.client, res.data));
        });
      } else {
        return new Promise((resolve, reject) => {
          return resolve(this.messages.get(message));
        })
      };
    } else {
      return this.client.rest.request("GET", ENDPOINTS.CHANNEL_MESSAGE(this.id, message))
      .then(res => {
        return new Message(this.client, res.data);
      });
    };
  }

  /**
   * Fetches messages for the channel
   * @param {Object} options Query options for fetching Message
   * @param {Number} [options.limit=50] Maximum amount of messages to fetch
   * @param {Snowflake} [options.after] Get messages after this message id
   * @param {Snowflake} [options.around] Get messages around this message id
   * @param {Snowfalke} [options.before] Get messages before this message id
   * @returns {Promise<Array<Message>>}
   */

  getMessages(options = { limit: 50 }) {
    var query = [];

    if (options.before && typeof options.before === 'string')
      query.push(`&before=${options.before}`)

    if (options.after && typeof options.after === 'string')
      query.push(`&after=${options.after}`)

    if (options.around && typeof options.around === 'string')
      query.push(`&around=${options.around}`)

    return this.client.rest.request("GET", `${ENDPOINTS.CHANNEL_MESSAGES(this.id)}?limit=${options.limit}${query.join('')}`)
    .then(res => {
      return res.data.map(message => {
        if (this.client.storeMessages) {
          if (!this.messages.has(message.id)) {
            return this.messages.set(message.id, new Message(this.client, message));
          } else {
            return this.messages.get(message.id);
          };
        } else {
          return new Message(this.client, message);
        }
      });
    });
  }

  /**
   * Fetches all the pinned messages in the channel
   * @return {Promise<Array<Message>>}
   */

  getPinnedMessages() {
    return this.client.rest.request("GET", ENDPOINTS.CHANNEL_PINNED_MESSAGES(this.id))
    .then(res => {
      return res.data.map(message => {
        if (this.client.storeMessages) {
          if (!this.messages.has(message.id)) {
            this.messages.set(message.id, new Message(this.client, message));
          } else {
            this.messages.get(message.id);
          };
        } else {
          return new Message(this.client, message);
        }
      });
    });
  }

  /**
   * Get a list of users that reacted with the given emoji
   * @param {Snowflake} message The id of the message that has the reactions
   * @param {String} emoji The emoji that the users reacted to
   * @param {Object} [options] options for the fetch
   * @returns {Promise<Array<User>>}
   */

  getReactions(message, emoji, options = {}) {
    var query = [];

    if (options.before && typeof options.before === 'string')
      query.push(`&before=${options.before}`)

    if (options.after && typeof options.after === 'string')
      query.push(`&after=${options.after}`)

    return this.client.rest.request("GET", `${ENDPOINTS.CHANNEL_REACTION(this.id, message, encodeURI(emoji), '')}${query.join('')}`)
    .then(res => {
      return res.data.map(async user => {
        return await this.client.getUser(user.id);
      });
    });
  }

  /**
   * Edits a message's embed, not content!
   * @deprecated Use TextChannel#patchMessage() instead.
   * @param {Snowflake} message The id of the message to edit
   * @param {String} content The new embed of the message, not content!
   * @returns {Promise<Message>}
   */

  patchEmbed(message, embed) {
    this.deprecator.deprecate('TextChannel', 'patchEmbed', 'TextChannel', 'patchMessage');
    return this.client.rest.request("PATCH", ENDPOINTS.CHANNEL_MESSAGE(this.id, message), {
      data: {
        content: null,
        embed: embed.hasOwnProperty('embed') ? embed.embed : embed
      }
    }).then(res => {
      return new Message(this.client, res.data);
    });
  }

  /**
   * Edits a message
   * @param {Snowflake} message The id of the message
   * @param {Object} options Options for the message editing
   * @param {String} options.content The content of the message
   * @param {Embed} options.embed The embed for the message
   * @returns {Promise<Message>}
   */

  patchMessage(message, options = {}) {
    return this.client.patchMessage(this.id, message, options);
  }

  /**
   * Removes all reactions from the message
   * @param {Snowflake} message The id of the message you will remove all reactions from
   * @returns {Promise<Message>}
   */

  removeAllReactions(message) {
    return this.client.rest.request("DELETE", ENDPOINTS.CHANNEL_REACTIONS(this.id, message))
    .then(async () => {
      return await this.getMessage(message);
    })
  }

  /**
   * Deletes a single message
   * @param {Snowflake} message The id of the message deleted
   * @param {Number} timeout The amount of time to wait before deleting the message in ms
   * @returns {Void} Would return "{ deleted: true }" if it got deleted
   */

  removeMessage(message, timeout = 0) {
    setTimeout(() => {
      return this.client.rest.request("DELETE", ENDPOINTS.CHANNEL_MESSAGE(this.id, message));
    }, timeout);
  }

  /**
   * Delete multiple messages in the channel
   * * Minimum messages to delete: `1`, Maximum: `100`
   * @param {Number} [limit=50] The amount of messages to delete
   */

  async removeMessages(limit = 50) {
    if (limit === 0) {
      return Promise.resolve();
    };

    if (limit === 1) {
      let msg = await this.getMessages({ limit: 1 });
      this.removeMessage(msg[0].id);
      return msg[0];
    };

    if (limit > 100) return this.client.emit('error', new Error('Too many messages to delete!'));

    let msg = await this.getMessages({ limit });
    return this.client.rest.request("POST", ENDPOINTS.CHANNEL_BULKDELETE(this.id), {
      data: {
        messages: msg.map(m => m.id)
      }
    }).then(() => {
      return msg;
    });
  }

  /**
   * Deletes a reaction from a message
   * @param {Snowflake} message The id of the message to remove a reaction from
   * @param {String} emoji The unicode of the emoji or for custom emojis, use `name:id`
   * * For emojis that aren't custom, you need to get their unicode by doing: \:emojiname:
   * for example, \:thinking: will give '🤔', then use it to react. While for customs, just do `name:id`
   * @returns {Promise<Message>}
   */

  async removeReaction(message, emoji) {
    await this.client.rest.request("DELETE", ENDPOINTS.CHANNEL_REACTION(this.id, message, encodeURI(emoji), '@me'));

    let msg = await this.getMessage(message);
    return msg;
  }

  /**
   * Deletes a user's reaction from a message
   * @param {Snowflake} user The id of the user that added the reaction
   * @param {Snowflake} message The id of the message to remove a reaction from
   * @param {String} emoji The unicode of the emoji or for custom emojis, use `name:id`
   * * For emojis that aren't custom, you need to get their unicode by doing: \:emojiname:
   * for example, \:thinking: will give '🤔', then use it to react. While for customs, just do `name:id`
   * @returns {Promise<Message>}
   */

  async removeUserReaction(user, message, emoji) {
    await this.client.rest.request("DELETE", ENDPOINTS.CHANNEL_REACTION(this.id, message, encodeURI(emoji), user));

    let msg = await this.getMessage(message);
    return msg;
  }

  /**
   * Sends a message to the channel
   * @param {Object} options 
   * @param {String} [options.content] The content of the message
   * @param {Embed} [options.embed] The embed object of the message
   * @returns {Promise<Message>}
   */

  send(options = {}) {
    return this.client.sendMessage(this.id, options);
  }
};

module.exports = TextChannel;