const axios = require('axios');
const { HTTP } = require('../utils/Constants');
const DiscordAPIError = require('./DiscordAPIError');
const DiscordRESTError = require('./DiscordRESTError');

/**
 * Represents the Handler for our Rest Requests
 */

class RequestHandler {
  constructor(client) {
    this.client = client;
  }

  /**
   * Makes a rest request
   * @param {String} method The method of the rest request
   * @param {String} url The url to do a request
   * @param {String} [data] The data for the request
   * @returns {Object<Data>}
   */

  async request(method, url, data = {}) {
    var methods = ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'];

    if (!methods.includes(method)) return this.client.emit('error', new Error('Invalid HTTP Method!'));

    try {
      return await axios({
        method: method,
        url: `${HTTP.BASE}${url}`,
        data: data.data,
        headers: {
          Authorization: `Bot ${this.client.token}`
        }
      });
    } catch (error) {
      if (error && !error.response) return this.client.emit('error', new Error(error));
      if (error.response.data.code) return this.client.emit('error', new DiscordRESTError(error.response.data.message, error.response.data.code));

      switch (error.response.status) {
        case 400:
          this.client.emit('error', new DiscordAPIError('Bad Request', 400));
          break;

        case 401:
          this.client.emit('error', new DiscordAPIError('Client Unauthorized', 401));
          break;

        case 403:
          this.client.emit('error', new DiscordAPIError('Client Forbidden', 403));
          break;

        case 404:
          this.client.emit('error', new DiscordAPIError('Not Found', 404));
          break;

        case 405:
          this.client.emit('error', new DiscordAPIError('Method not allowed', 405));
          break;

        case 429:
          this.client.emit('error', new DiscordAPIError('You are being rate limited', 429));
          break;

        case 502:
          this.client.emit('error', new DiscordAPIError('Gateway unavailable ( Please contact devs about this )', 502))
          break;

        default:
          this.client.emit('debug', { shard: 'REST', message: `Received unknown status code: ${error.response.status}` });
          break;
      };
    }
  }
};

module.exports = RequestHandler;