module.exports = {
  GATEWAY: {
    VERSION: 6
  },
  HTTP: {
    VERSION: 7,
    get BASE() {
      return `https://discordapp.com/api/v${this.VERSION}`
    },
    ENDPOINTS: {
      GATEWAY: '/gateway',

      /* User */
      USER: (userID) => `/users/${userID}`,
      USER_CHANNELS: (userID) => `/users/${userID}/channels`,
      USER_GUILD: (guildID) => `/users/@me/guilds/${guildID}`,
      USERS: `/users`,

      /* Channels */
      CHANNEL: (channelID) => `/channels/${channelID}`,
      CHANNEL_PERMISSION: (channelID, userOrRoleID) => `/channels/${channelID}/permissions/${userOrRoleID}`,
      CHANNEL_REACTION: (channelID, messageID, emoji, user) => `/channels/${channelID}/messages/${messageID}/reactions/${emoji}/${user}`,
      CHANNEL_REACTIONS: (channelID, messageID) => `/channels/${channelID}/messages/${messageID}/reactions`,
      CHANNEL_INVITES: (channelID) => `/channels/${channelID}/invites`,
      CHANNEL_MESSAGE: (channelID, messageID) => `/channels/${channelID}/messages/${messageID}`,
      CHANNEL_MESSAGES: (channelID) => `/channels/${channelID}/messages`,
      CHANNEL_BULKDELETE: (channelID) => `/channels/${channelID}/messages/bulk-delete`,
      CHANNEL_PIN_MESSAGES: (channelID, messageID) => `/channels/${channelID}/pins/${messageID}`,
      CHANNEL_PINNED_MESSAGES: (channelID) => `/channels/${channelID}/pins`,
      CHANNEL_WEBHOOKS: (channelID) => `/channels/${channelID}/webhooks`,

      /* Guild */
      GUILDS: `/guilds`,
      GUILD: (guildID) => `/guilds/${guildID}`,
      GUILD_MEMBER_NICK: (guildID, userID) => `/guilds/${guildID}/members/${userID}/nick`,
      GUILD_BAN: (guildID, userID) => `/guilds/${guildID}/bans/${userID}`,
      GUILD_BANS: (guildID) => `/guilds/${guildID}/bans`,
      GUILD_CHANNEL: (guildID, channelID) => `/guilds/${guildID}/channels/${channelID}`,
      GUILD_CHANNELS: (guildID) => `/guilds/${guildID}/channels`,
      GUILD_INVITES: (guildID) => `/guilds/${guildID}/invites`,
      GUILD_MEMBER: (guildID, userID) => `/guilds/${guildID}/members/${userID}`,
      GUILD_MEMBERS: (guildID) => `/guilds/${guildID}/members`,
      GUILD_REGIONS: (guildID) => `/guilds/${guildID}/regions`,
      GUILD_PRUNE: (guildID) => `/guilds/${guildID}/prune`,
      GUILD_ROLES: (guildID) => `/guilds/${guildID}/roles/`,
      GUILD_ROLE: (guildID, roleID) => `/guilds/${guildID}/roles/${roleID}`,
      GUILD_MEMBER_ROLE: (guildID, userID, roleID) => `/guilds/${guildID}/members/${userID}/roles/${roleID}`
    }
  },

  CHANNEL_TYPES: [
    "text",
    "dm",
    "voice",
    "groupdm",
    "category"
  ],

  PERMISSIONS: {
    createInstantInvite: 0x00000001,
    kickMembers: 0x00000002,
    banMembers: 0x00000004,
    administrator: 0x00000008,
    manageChannels: 0x00000010,
    manageGuild: 0x00000020,
    addReactions: 0x00000040,
    viewAuditLog: 0x00000080,
    viewChannel: 0x00000400,
    sendMessages: 0x00000800,
    sendTTSMessages: 0x00001000,
    manageMessages: 0x00002000,
    embedLink: 0x00004000,
    attachFiles: 0x00008000,
    readMessageHistory: 0x00010000,
    mentionEveryone: 0x00020000,
    useExternalEmojis: 0x00040000,
    voiceConnect: 0x00100000,
    voiceSpeak: 0x00200000,
    voiceMuteMembers: 0x00400000,
    voiceDeafenMembers: 0x00800000,
    voiceMoveMembers: 0x01000000,
    voiceUseVAD: 0x02000000,
    voicePrioritySpeaker: 0x00000100,
    changeNickname: 0x04000000,
    manageNicknames: 0x08000000,
    manageRoles: 0x10000000,
    manageWebhooks: 0x20000000,
    manageEmojis: 0x40000000
  }
};