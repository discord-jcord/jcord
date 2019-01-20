const User = require('./User');

/**
 * @extends User
 * @prop {String} avatar The avatar hash of the user
 * @prop {String} avatarURL The url of the user's avatar
 * @prop {Boolean} bot Whether the user is a bot or not
 * @prop {String} discriminator The discriminator of the user
 * @prop {String?} email The email of the client
 * @prop {Snowflake} id The id of the user
 * @prop {Boolean} mfaEnabled Whether the client has mfa enabled
 * @prop {String} tag The tag of the user
 * @prop {String} username The username of the user
 * @prop {Boolean} verified Whether the client is verified
 */

class ClientUser extends User {
  constructor(client, data) {
    super(client, data);
    Object.defineProperty(this, 'client', { value: client });

    this.email = data.email || null;
    this.locale = data.locale || null;
    this.mfaEnabled = data.mfa_enabled;
    this.verified = data.verified;
  }
};

module.exports = ClientUser;