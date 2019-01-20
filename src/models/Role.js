class Role {
  constructor(client, data) {
    Object.defineProperty(this, 'client', { value: client });

    this.color = data.color;
    this.id = data.id;
    this.isHoisted = data.hoist;
    this.isManaged = data.managed;
    this.isMentionable = data.mentionable;
    this.mention = `<@&${this.id}>`;
    this.name = data.name;
    this.permissions = data.permissions;
    this.position = data.position;
  }

  toString() {
    return `<@&${this.id}>`;
  }
};

module.exports = Role;