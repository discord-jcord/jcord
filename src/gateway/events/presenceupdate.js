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
    } else {
      let OldPresence = shard.client._presences.get(packet.d.user.id)
      let newPresence = shard.client._presences.set(packet.d.user.id, packet.d);

      if (!OldPresence || OldPresence.status === newPresence.status) return;

      let old_data = {
        status: OldPresence.status,
        game: OldPresence.game
      };

      let new_data = {
        status: newPresence.status,
        game: newPresence.game
      }

      /**
       * Emitted once a User updates his Status
       * @event Client.PRESENCE_UPDATE
       * @prop {Object} old_data The old presence data
       * @prop {String} old_data.status The old status
       * @prop {Object?} old_data.game The old activity data
       * @prop {Object} new_data The new presence data
       * @prop {String} new_data.status The new status
       * @prop {Object?} new_data.game The new activity data
       */

      shard.client.emit('PRESENCE_UPDATE', old_data, new_data);
    }
  }
};

module.exports = PresenceUpdate;
