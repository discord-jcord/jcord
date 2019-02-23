module.exports = {
  Client: require('./client/Client'),
  CommandCreator: require('./command/Creator'),
  EmbedBuilder: require('./utils/EmbedBuilder'),
  Store: require('./utils/Store'),
  Version: require('../package.json').version
};