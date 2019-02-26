const Client = require('../client/Client');
const Store = require('../utils/Store');

/**
 * @extends Client Represents the Command Creator feature
 * @prop {Store} _commands A store of Commands ( Where registered commands are added )
 * @prop {Object} [options] Options for the command creator
 * @prop {Boolean} [options.customPrefix=false] Whether to use a by-guild custom prefix
 * @prop {String} [options.defaultPrefix='!'] The default Prefix of the bot
 * @prop {Array} [options.owners=[]] An array of bot owner ids
 */

class CommandCreator extends Client {
  constructor(options = {}) {
    super(options);

    this.showWarnings = options.showWarnings || true;
    this._commands = new Store();
    this.defaultPrefix = options.defaultPrefix || '!';
    this.owners = options.owners || [];
    this.customPrefix = options.customPrefix || false;

    let depo = null;

    if (this.customPrefix) {
      try {
        require('depo');
        depo = (this.db = new (require('depo')).Database({ name: 'jcord' }));
      } catch(error) {
        depo = null;
        try {
          require('endb');
          depo = (this.db = new (require('endb')).Database({ name: 'jcord' }));
        } catch(err) {
          this.emit('error', new Error(`
If you would want to get the current guild prefix,
please install "depo" for a json database,
or "endb" for a sqlite3 based database
`));
        };
      };
    }
    
    if (!Array.isArray(this.owners)) return this.emit('error', new Error('CommandCreator#owners must be an array!'));
    
    this.on('MESSAGE_CREATE', async (msg) => {
      if (depo && msg.channel.guild && !await this.db.has(msg.channel.guild.id)) {
      await this.db.set(msg.channel.guild.id, { prefix: this.defaultPrefix });
      }

      let settings = await this.db.get(msg.channel.guild.id);

      if (msg.content.indexOf(settings.prefix) !== 0) return;

      const args = msg.content.slice(settings.prefix.length).split(/ +/g);
      const cmd = args.shift().toLowerCase();

      let commandData = this._commands.get(cmd) || this._commands.find(c => c.aliases && c.aliases.includes(cmd));

      if (!commandData) return;

      let argsData = {};

      for (var i = 0; i < commandData.args.length; i++) {
        if (commandData.args[i].type === 'number' && (!args[i] || isNaN(args[i]))) {
          return msg.channel.send({ content: commandData.args[i].prompt });
        } else if (commandData.args[i].type === 'string' && (!args[i] || typeof args[i] !== 'string')) {
          return msg.channel.send({ content: commandData.args[i].prompt });
        } else if (commandData.args[i].type === 'user') {
          let filteredTypes = commandData.args.filter(data => data.type === 'user');
          
          for (var c = 0; c < filteredTypes.length; c++) {
            if (!args[i] || !msg.mentions[c]) {
              return msg.channel.send({ content: filteredTypes[c].prompt });
            }
          };
        } else if (commandData.args[i].type === 'channel') {
          let filteredTypes = commandData.args.filter(data => data.type === 'channel');
          
          for (var c = 0; c < filteredTypes.length; c++) {
            if (!args[i] || !msg.channelMentions[c]) {
              return msg.channel.send({ content: filteredTypes[c].prompt });
            }
          };
        } else if (commandData.args[i].type === 'role') {
          let filteredTypes = commandData.args.filter(data => data.type === 'role');
          
          for (var c = 0; c < filteredTypes.length; c++) {
            if (!args[i] || !msg.roleMentions[c]) {
              return msg.channel.send({ content: filteredTypes[c].prompt });
            }
          };
        } else if (commandData.args[i].type === 'user_id' && (!args[i] || this.users.get(args[i]))) {
          return msg.channel.send({ content: commandData.args[i].prompt });
        } else if (commandData.args[i].type === 'channel_id' && (!args[i] || this.channels.get(args[i]))) {
          return msg.channel.send({ content: commandData.args[i].prompt });
        } else if (commandData.args[i].type === 'role_id' && (!args[i] || msg.channel.guild && msg.channel.guild.roles.get(args[i]))) {
          return msg.channel.send({ content: commandData.args[i].prompt });
        } else if (commandData.args[i].type === 'guild_id' && (!args[i] || this.guilds.get(args[i]))) {
          return msg.channel.send({ content: commandData.args[i].prompt });
        }
      };

      for (var i = 0; i < commandData.args.length; i++) {
        argsData[commandData.args[i].key] = args[i];
      };

      if (Array.isArray(commandData.reply)) {
        commandData.reply = commandData.reply[Math.floor(Math.random() * commandData.reply.length)];
      } else if (typeof commandData.reply === 'object' && reply.hasOwnProperty('reply')) {
        commandData.reply = commandData.reply.reply;
      } else if (typeof commandData.reply === 'string') {
        commandData.reply = commandData.reply;
      } else if (typeof commandData.reply === 'function') {
        commandData.reply = commandData.reply;
      } else {
        return this.emit('error', new Error('Invalid type of Parameter <reply>'));
      };

      if (commandData.guildOnly && !msg.channel.guild || commandData.dmOnly && msg.channel.type !== 'dm') return;
      if (commandData.ownerOnly && !this.owners.includes(msg.author.id)) return msg.channel.send({ content: `This is an owner only command!` });

      return typeof commandData.reply === 'function' ? commandData.reply.bind(null, msg, argsData)() : msg.channel.send({ content: commandData.reply });
    });
  }

  /**
   * Adds a new owner for the bot
   * This will add a new owner for the current cache, you can use a database
   * to make this persistent, but for this request, it will only save to the current session.
   * We will try to add a way to make this persistent.
   * @param {Snowflake} owner The id of the owner to add
   * @returns {Array<Snowflake>} The array of owners
   */

  addOwner(owner) {
    this.owners.push(owner);
    return this.owners;
  }

  /**
   * Deletes a Created Command
   * @param {String} name The name of the command to delete
   * @returns {Command}
   */

  deleteCommand(name) {
    return this._commands.has(name) ? this._commands.delete(name) : this.emit('error', new Error('Invalid command!'));
  }

  /**
   * Creates an executable command
   * * If the reply parameter is an Array, it will choose a random element from the array to send
   * * If the reply parameter is an Object, you need to add a "reply" property
   * * If the reply parameter is a String, it will send that string
   * * If the reply parameter is a Function, it will not send a message by default.
   * It means that if you supply a Function, it would do what the function says it would do
   * instead of sending the message. You can still send messages with a function, but you need to do it
   * inside the function.
   * @param {String} name 
   * @param {String|Array|Object|Function} reply What the bot will do or reply once this command is triggered
   * @returns {Command}
   */

  registerCommand(name, reply, options = {}) {
    if (typeof name !== 'string')
      return this.emit('error', new Error('Parameter <name> was not a string!'));

    let commandData = {
      args: options.args || [],
      guildOnly: options.guildOnly || false, 
      hidden: options.hidden || false, 
      description: options.description || 'A Command', 
      aliases: options.aliases || [],
      dmOnly: options.dmOnly || false,
      ownerOnly: options.ownerOnly || false,
      reply
    };

    name = name.toLowerCase();

    for (var i = 0; i < commandData.args.length; i++) {
      if ((typeof commandData.args[i] !== 'object' && !Array.isArray(commandData.args[i])) ||
      !commandData.args[i].hasOwnProperty('key') ||
      !commandData.args[i].hasOwnProperty('prompt') ||
      !commandData.args[i].hasOwnProperty('type')) {
        return this.emit('error', new Error(`The argument options at position ${i} was invalid!`));
      } else {
        commandData.args[i].key = commandData.args[i].key.toLowerCase();
        commandData.args[i].type = commandData.args[i].type.toLowerCase();
      }
    };

    if (Array.isArray(reply)) {
      this._commands.set(name, commandData);
      return { name, commandData };
    } else if (typeof reply === 'object') {
      if (!reply.hasOwnProperty('reply')) return this.emit('error', new Error('Since reply is a Object, please add a "reply" property! Here is an example:\n{ reply: "Hi!" }'))
      this._commands.set(name, commandData);
      return { name, commandData };
    } else if (typeof reply === 'string') {
      this._commands.set(name, commandData);
      return { name, commandData };
    } else if (typeof reply === 'function') {
      this._commands.set(name, commandData);
      return { name, commandData };
    } else {
      this.emit('error', new Error('Invalid type of Parameter <reply>'));
    }
  }

  /**
   * Registers a custom prefix for the guild
   * @param {Snowflake} guild The id of the guild
   * @param {String} prefix The new custom prefix
   * @returns {Void}
   */

  registerGuildPrefix(guild, prefix) {
    if (!this.customPrefix) {
      this.emit('error', new Error('You can\'t use this function if CommandCreator#customPrefix is not true!'));
      return false;
    }

    this.db.set(guild, { prefix });
    return true;
  }

  /**
   * Removes an owner id from the list of owners in the cache
   * @param {Snowflake} owner The id of the owner to remove
   * @returns {Boolean}
   */

  removeOwner(owner) {
    let index = this.owners.indexOf(owner);

    if (index <= -1) {
      return false;
    } else {
      this.owners.splice(index, 1);
      return true;
    };
  }
};

module.exports = CommandCreator;