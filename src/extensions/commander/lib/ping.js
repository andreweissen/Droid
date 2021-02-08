// @ts-check
/**
 * @file The <code>ping</code> module serves to encapsulate the class of the
 * same name. The <code>Ping</code> class is used within the context of the bot
 * application as a simple and function-light means of testing whether the
 * application is actually online, a required function given that the bot may
 * often appear to be online while in reality is suffering from a bug.
 * @module ping
 * @author Andrew Eissen <andrew@andreweissen.com>
 * @requires command
 */
"use strict";

/** @const {Command} Command - Command module, returns class */
const Command = require("../../../util/command.js");

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
   * @override
   * @see [Command#execute]{@link module:command~Command#execute}
   * @param {Object} message - A new [Discord.Message]{@link
   * http://discord.js.org/#/docs/main/master/class/Message} class instance
   * containing information pertaining to the most recent server message, its
   * author, and the channel in which it was posted, among other data.
   * @param {Array<string>} args - An array of <code>string</code>s constituting
   * the arguments that follow the initial command invocation. Due to its
   * simplicity, the <code!ping</code> command takes no subsequent arguments, so
   * the value of this parameter is not used or checked by the method.
   * @param {Function} logReply - A reference to the [Extension#addReply]{@link
   * module:extension~Extension#addReply} method, bound to the
   * <code>Commander</code> class instance. This ensures command subclasses are
   * not directly interfacing with the server channels, a responsibility under
   * the exclusive purview of classes that extend <code>Extension</code> alone.
   * @returns {Promise<void>}
   */
  async execute (message, args, logReply) {
    logReply(message, this.lang.success[
      (message.channel.id === this.config.channels.moderator)
        ? "custom"
        : "default"
    ]);
  }
}

module.exports = Ping;