"use strict";

/**
 * Makes creating embeds simplier
 * @prop {Object} author The author of the embed
 * @prop {Number} color The color of the embed 
 * @prop {String} description The description of the embed
 * @prop {Array} fields An array of embed fields
 * @prop {Object} footer The footer of the embed
 * @prop {String} image The image of the embed
 * @prop {String} timestamp The timestamp of the embed
 * @prop {String} title The title of the embed
 * @prop {String} thumbnail The thumbnail of the embed
 * @prop {String} type The type of the embed
 */

class EmbedBuilder {
  constructor(data = {}) {
    this.type = data.type;
    this.title = data.title;
    this.description = data.description;
    this.color = data.color;
    this.timestamp = data.timestamp;
    this.fields = data.fields || [];
    this.thumbnail = data.thumbnail;
    this.image = data.image;
    this.author = data.author;
    this.footer = data.footer;
  }

  get hexColor() {
    return this.color ? `#${this.color.toString(16).padStart(6, '0')}` : null;
  }

  /**
   * Makes an embed author
   * @param {Object} [options] Options for the Author to make for the embed
   * @param {String} [options.name] The name of the author
   * @param {String} [options.iconURL] The url of the icon of the author
   * @param {Stirng} [options.url] The url of the author
   * @returns {EmbedBuilder}
   */

  makeAuthor(options = {}) {
    this.author = { name: options.name, icon_url: options.iconURL, url: options.url };
    return this;
  }

  /**
   * Makes the color of the embed
   * @param {String|Number} [color] The color of the embed
   * @returns {EmbedBuilder}
   */

  makeColor(color) {
    if (!color) color = 0;

    if (typeof(color) === 'string' && color.startsWith('#')) {
      var hex = color.substring(1);
      var decimal = "0x" + hex;

      color = parseInt(decimal.substring(2), 16)
    };

    this.color = color;
    return this;
  }

  /**
   * Makes an embed description
   * @param {String} [description] The description of the embed
   * @returns {EmbedBuilder}
   */

  makeDescription(description) {
    if (description && description.length > 2048) throw new RangeError('Maximum Embed Description lenght Reached! ( Up to 2048 Only! )')

    this.description = description;
    return this;
  }

  /**
   * Makes an embed footer
   * @param {String} text The footer text
   * @param {String} iconURL The icon of the footer
   * @returns {EmbedBuilder}
   */

  makeFooter(text, iconURL) {
    if (text.length > 2048) throw new RangeError('Maximum Embed Footer Reached! ( Up to 2048 only! )');

    this.footer = { text, icon_url: iconURL };
    return this;
  }

  /**
   * Make the image of the embed
   * @param {String} url The url of the image
   * @returns {EmbedBuilder}
   */

  makeImage(url) {
    this.image = { url };
    return this;
  }

  /**
   * Make the thumbnail of the embed
   * @param {String} url The url of the thumbnail
   * @returns {EmbedBuilder}
   */

  makeThumbnail(url) {
    this.thumbnail = { url };
    return this;
  }

  /**
   * Make the timestamp of the embed
   * @param {String} timestamp The timestamp of the embed
   * @returns {EmbedBuilder}
   */

  makeTimestamp(timestamp = new Date()) {
    this.timestamp = timestamp;
    return this;
  }

  /**
   * Pushes a field to the embed
   * @param {Object} [options] Options for the field
   * @param {String} options.name The name of the field
   * @param {String} options.value The value of the field
   * @param {Boolean} [options.inline=false] Whether to inline the embed
   */

  pushField(options = { inline: false }) {
    if (this.fields.length === 25) throw new RangeError('Maximum Embed Fields Reached! ( Up to 25 Fields only )');
    if (!options.name) throw new Error('No Field Name given!');
    if (options.name && options.name.length > 256) throw new RangeError('Maximum Embed Field Name length Reached! ( Up to 256 Only! )');
    if (!options.value) throw new Error('No Field Value given!');
    if (options.value && options.value.length > 1024) throw new RangeError('Maximum Embed Field Name length Reached! ( Up to 1024 Only! )');

    options.inline = Boolean(options.inline);
    this.fields.push(options);

    return this;
  }
};

module.exports = EmbedBuilder;