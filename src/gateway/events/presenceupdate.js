"use strict";

// models
const User = require('../../models/User');

class PresenceUpdate {
  constructor() {}

  emit(shard, packet) {
    let oldUser = shard.client.users.get(packet.d.user.id);

    if (packet.d.user && packet.d.user.username) {
      let newUser = shard.client.users.set(packet.d.user.id, new User(shard.client, packet.d.user));
      
      if (newUser !== oldUser) {
        /**
         * Emitted once a User updates his/her info
         * @event Client.USER_UPDATE
         * @prop {User} oldUser The old data of the user ( Not present in cache )
         * @prop {User} newUser The new data of the user ( Present in cache )
         */

        shard.client.emit('USER_UPDATE', oldUser, newUser);
      };
    }
  }
};

module.exports = PresenceUpdate;