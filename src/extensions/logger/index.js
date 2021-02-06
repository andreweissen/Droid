// @ts-check
/**
 * @file The <code>logger</code> module serves to encapsulate the class of the
 * same name. The <code>Logger</code> class, which extends the base
 * [Extension]{@link module:extension~Extension} superclass, serves to
 * coordinate the initialization of the message logger that passively observes
 * the verification channel and loads all user messages (including verification
 * requests) to a dedicated moderator-only channel for review.
 * @module logger
 * @author Andrew Eissen <andrew@andreweissen.com>
 * @requires extension
 */
"use strict";

/** @const {Object} Extension - Extension module, returns class */
const Extension = require("../../util/extension.js");

/**
 * @classdesc The <code>Logger</code> class is a subclass implementation of the
 * base [Extension]{@link module:extension~Extension} superclass that serves to
 * coordinate the initialization of the message logger that passively observes
 * the verification channel and loads all user messages (including verification
 * requests) to a dedicated moderator-only channel for subsequent review. This
 * functionality used to be grouped in with <code>Commander</code> extension in
 * an earlier version of the application, but the refactoring of the bot into
 * multiple plugins allowed for its removal to a separate extension file.
 * <br />
 * <br />
 * As with all subclasses extending <code>Extension</code>, the
 * <code>Commander</code> class includes an implementation of the required
 * [Extension#onMessage]{@link module:extension~Extension#onMessage} method.
 * This method serves as the event listener callback function that is attached
 * to "message" events by the [Client]{@link module:client~Client} and invoked
 * when a new message is added to a server channel. This particular
 * implementation of the method passively observes the verification channel and
 * logs all new messages, including well-formed verification requests made using
 * the <code>!verify</code> command, in a moderator-only channel for review.
 * @class
 * @augments Extension
 */
class Logger extends Extension {

  /**
   * @description The <code>onMessage</code> method constitutes the
   * <code>Logger</code> class's implementation of the [onMessage]{@link
   * module:extension~Extension#onMessage} method, one of the methods required
   * for implementation by all subclasses extending the [Extension]{@link
   * module:extension~Extension} class that serves as an event listener callback
   * function handling Discord "message" events.
   * <br />
   * <br />
   * This particular implementation is used to monitor the verify channel, which
   * by design should only be used to process verification requests. The method
   * checks all non-bot messages posted in the verify channel (including all
   * well-formed <code>!verify</code> commands), logging them in a
   * moderator-exclusive channel for subsequent review. In cases of messages
   * that do not constitute properly formatted verification requests, the method
   * adds a bot reply informing the user of the verification channel's purpose
   * and removing both the message and the reply after a set interval.
   * @function
   * @override
   * @see [Extension#onMessage]{@link module:extension~Extension#onMessage}
   * @param {Object} message - A new [Discord.Message]{@link
   * http://discord.js.org/#/docs/main/master/class/Message} class instance
   * containing information pertaining to the most recent server message, its
   * author, and the channel in which it was posted, among other data.
   * @returns {void}
   */
  onMessage (message) {
    const commands = this.config.commands;
    const channels = this.config.channels;
    const verify = commands.prefix + commands.names.verify;

    // Disregard all bot messages and messages outside the verify channel
    if (message.author.bot || message.channel.id !== channels.verify) {
      return;
    }

    // Post in Chat Moderator "logs" channel
    message.client.channels.cache.get(channels.logs).send(
      `${message.author.tag}:\n> ${message.content}`
    );

    // Add reply if user attempts action other than !verify in verify channel
    if (!message.content.startsWith(verify)) {
      return this.addReply(message, this.lang.error.unrelated);
    }
  }
}

module.exports = Logger;