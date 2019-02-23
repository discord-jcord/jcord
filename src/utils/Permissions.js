const Store = require("./Store");

/**
 * @class The guild-wide or channel permissions of the member
 */

class Permission {
  constructor(num) {
    this.col = new Store();

    if ((num & 8) === 8) {
      num = 0b1111111111101111111110011111111;
    }
    if (num & (1 << 30)) {
      this.col.set("manageEmojis", true);
      num -= (1 << 30);
    }
    if (num & (1 << 29)) {
      this.col.set("manageWebhooks", true);
      num -= (1 << 29);
    }
    if (num & (1 << 28)) {
      this.col.set("manageRoles", true);
      num -= (1 << 28);
    }
    if (num & (1 << 27)) {
      this.col.set("manageNicknames", true);
      num -= (1 << 27);
    }
    if (num & (1 << 26)) {
      this.col.set("changeNickname", true);
      num -= (1 << 26);
    }
    if (num & (1 << 25)) {
      this.col.set("voiceUseVAD", true);
      num -= (1 << 25);
    }
    if (num & (1 << 24)) {
      this.col.set("voiceMoveMembers", true);
      num -= (1 << 24);
    }
    if (num & (1 << 23)) {
      this.col.set("voiceDeafenMembers", true);
      num -= (1 << 23);
    }
    if (num & (1 << 22)) {
      this.col.set("voiceMuteMembers", true);
      num -= (1 << 22);
    }
    if (num & (1 << 21)) {
      this.col.set("voiceSpeak", true);
      num -= (1 << 21);
    }
    if (num & (1 << 20)) {
      this.col.set("voiceConnect", true);
      num -= (1 << 20);
    }
    if (num & (1 << 18)) {
      this.col.set("externalEmojis", true);
      num -= (1 << 18);
    }
    if (num & (1 << 17)) {
      this.col.set("mentionEveryone", true);
      num -= (1 << 17);
    }
    if (num & (1 << 16)) {
      this.col.set("readMessageHistory", true);
      num -= (1 << 16);
    }
    if (num & (1 << 15)) {
      this.col.set("attachFiles", true);
      num -= (1 << 15);
    }
    if (num & (1 << 14)) {
      this.col.set("embedLinks", true);
      num -= (1 << 14);
    }
    if (num & (1 << 13)) {
      this.col.set("manageMessages", true);
      num -= (1 << 13);
    }
    if (num & (1 << 12)) {
      this.col.set("sendTTSMessages", true);
      num -= (1 << 12);
    }
    if (num & (1 << 11)) {
      this.col.set("sendMessages", true);
      num -= (1 << 11);
    }
    if (num & (1 << 10)) {
      this.col.set("readMessages", true);
      num -= (1 << 10);
    }
    if (num & (1 << 7)) {
      this.col.set("viewAuditLogs", true);
      num -= (1 << 7);
    }
    if (num & (1 << 6)) {
      this.col.set("addReactions", true);
      num -= (1 << 6);
    }
    if (num & (1 << 5)) {
      this.col.set("manageGuild", true);
      num -= (1 << 5);
    }
    if (num & (1 << 4)) {
      this.col.set("manageChannels", true);
      num -= (1 << 4);
    }
    if (num & (1 << 3)) {
      this.col.set("administrator", true);
      num -= (1 << 3);
    }
    if (num & (1 << 2)) {
      this.col.set("banMembers", true);
      num -= (1 << 2);
    }
    if (num & (1 << 1)) {
      this.col.set("kickMembers", true);
      num -= (1 << 1);
    }
    if (num & (1 << 0)) {
      this.col.set("createInstantInvite", true);
      num -= (1 << 0);
    }
  }

  /**
   * Check if the permission is present
   * @param {String} key The name of the permission
   * @returns {Boolean}
   */

  has(key) {
    return this.col.has(key);
  }
};

module.exports = Permission;