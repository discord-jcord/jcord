"use strict";

class GuildDelete {
  constructor() {}

  emit(shard, packet) {
    let guild = shard.client.guilds.get(packet.d.id);

    shard.client.guilds.delete(guild.id);
    shard.guilds.delete(guild.id);

    /**
     * Emitted once a Guild becomes Unavailable or the bot leaves a Guild
     * @event Client.GUILD_DELETE
     * @prop {Guild} guild
     */
    return shard.client.emit('GUILD_DELETE', guild);
  }
};

module.exports = GuildDelete;