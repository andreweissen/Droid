"use strict";

const Extension = require("../../../src/util/extension.js");

class Logger extends Extension {

  onMessage (message) {
    const commands = this.config.commands;
    const channels = this.config.channels;
    const lang = this.lang.logger;

    if (!message.author.bot && message.channel.id === channels.verify) {

      // Post in Chat Moderator "logs" channel
      message.client.channels.cache.get(channels.logs).send(
        `${message.author.tag}:\n> ${message.content}`
      );

      if (
        !message.content.startsWith(commands.prefix + commands.names.verify)
      ) {
        return this.addReply(message, lang.error.unrelated);
      }
    }
  }
}

module.exports = Logger;