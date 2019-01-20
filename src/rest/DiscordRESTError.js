class DiscordRESTError extends Error {
  constructor(message, code, stack) {
    super(message, code, stack);
    this.name = `DiscordRESTError(${code})`;
    this.code = code;
    this.message = message;
    if (stack) {
      this.stack = stack.replace(/\w*?Error/, `${this.name}: ${this.message}`);
    };
  }
};

module.exports = DiscordRESTError;