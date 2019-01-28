/**
 * @class Represents a guild role
 * @prop {Number} color The color of the role
 * @prop {String|Number} hexColor The hexadecimal representation of the role color
 * @prop {Snowflake} id The id of the role
 * @prop {Boolean} isHoisted Whether the role is seperate from the `@everyone` role
 * @prop {Boolean} isMentionable Whether the role is mentionable
 * @prop {String} mention The role in mention form
 * @prop {String} name The name of the role
 * @prop {Number} permissions The permissions of the role
 * @prop {Number} position The position of the role
 */

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

  get hexColor() {
    return `#${this.color.padStart(6, '0')}`;
  }

  toString() {
    return this.mention;
  }
};

module.exports = Role;