// @ts-check
/**
 * @file ping.js
 * @module ping
 * @author Andrew Eissen <andrew@andreweissen.com>
 * @requires command
 */
"use strict";

/** @const {Command} Command - Command module, returns class */
const Command = require("../util/command.js");

/**
 * @classdesc The <code>Ping</code> class is among the simpliest possible
 * implementations of the [Command]{@link module:command~Command} class. Its
 * sole method, the required [execute]{@link module:command~Command#execute},
 * simply logs a "!pong" reply to the command invocation to indicate that the
 * bot application is online and functional. This is helpful immediately after
 * new builds are committed, as the bot will sometimes deceptively appear to be
 * online when in reality it is broken on account of a bug.
 * @class
 * @augments Command
 */
class Ping extends Command {

  /**
   * @description The simplest implementation of the <code>Command</code>
   * class's required [Command#execute]{@link module:command~Command#execute}
   * method, <code>Ping#execute</code> is used solely to log a temporary
   * response message in the channel on invocation to indicate to the developer
   * that the application is online and functional.
   * @function
   * @see [Command#execute]{@link module:command~Command#execute}
   * @param {Object} message - A new <code>Discord.Message</code> class instance
   * containing information pertaining to the most recent server message, its
   * author, and the channel in which it was posted, among other data.
   * @param {Array<string>} args - An array of <code>string</code>s constituting
   * the arguments that follow the initial command invocation. Due to its
   * simplicity, the <code!ping</code> command takes no subsequent arguments, so
   * the value of this parameter is not used or checked by the method.
   * @param {Function} logReply - A reference to the [Client#addReply]{@link
   * module:client~Client#addReply} method, bound to the <code>Client</code>
   * class instance. This ensures command subclasses are not directly
   * interfacing with the server channels, a responsibility under the exclusive
   * purview of the Client class and its respective methods alone.
   * @returns {void}
   */
  execute (message, args, logReply) {
    logReply(message, this.lang.success[
      (message.channel.id === this.config.channels.moderator)
        ? "custom"
        : "default"
    ]);
  }
}

module.exports = Ping;