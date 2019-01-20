"use strict";

class UnavailableGuild {
  constructor(client, data) {
    Object.defineProperty(this, 'client', { value: client });

    this.available = !data.unavailable;
    this.id = data.id;
  }
};

module.exports = UnavailableGuild;