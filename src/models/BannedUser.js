"use strict";

const User = require('./User');

/**
 * @class Represents a Banned Member
 * @prop {String} reason The reason for the ban
 * @prop {User} user The user object of the banned member
 */

class BannedUsers {
  connstructor(client, data) {
    Object.defineProperty(this, 'client', { value: client });

    this.reason = data.reason;
    this.user = this.client.users.has(data.user.id) ? this.client.users.get(data.user.id) : this.client.users.set(data.user.id, new User(this.client, data.user));
  }
};

module.exports = BannedUsers;