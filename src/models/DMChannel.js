"use strict";

const Channel = require('./Channel');
const User = require('./User');
const Message = require('./Message');
const { ENDPOINTS } = require('../utils/Constants').HTTP;

/**
 * @extends Channel Represens a DM Channel.
 * @prop {Number} createdTimestamp Timestamp of when the channel was created
 * @prop {Snowflake?} lastMessageID The id of the last message sent
 * @prop {Array<User>} recipients An array of user recipients on the DM Channel
 */

class DMChannel extends Channel {
  constructor(client, data) {
    super(client, data);
    Object.defineProperty(this, 'client', {
      value: client
    });

    this.lastMessageID = data.last_message_id || null;
    this.recipients = data.recipients.map(user => {
      return this.client.users.has(user.id) ? this.client.users.get(user.id) : this.client.users.set(user.id, new User(this.client, user))
    });
  }

  /**
   * Creates an embed to the channel
   * @deprecated Use DMChannel#send() instead
   * @param {Object} embed The embed to send
   * @returns {Promise<Message>}
   */

  createEmbed(embed) {
    return this.client.createEmbed(this.id, embed);
  }

  /**
   * Creates a message to the channel
   * @deprecated Use DMChannel#send() instead
   * @param {String} content The content of the message
   * @returns {Promise<Message>}
   */

  createMessage(content) {
    return this.client.createMessage(this.id, content);
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

module.exports = DMChannel;