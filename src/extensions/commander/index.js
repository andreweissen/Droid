/**
 * @file The <code>commander</code> module serves to encapsulate the class of
 * the same name. The <code>Commander</code> class, which extends the base
 * [Extension]{@link module:extension~Extension} superclass, serves to
 * coordinate the loading and initialization of the bot application's command
 * functionality used to interact with the application in the server's channels.
 * @module commander
 * @author Andrew Eissen <andrew@andreweissen.com>
 */
"use strict";

/** @const {Object} path - Path module */
const path = require("path");

/** @const {Object} Extension - Extension module, returns class */
const Extension = require("../../util/extension.js");

/**
 * @classdesc The <code>Commander</code> class is a subclass implementation of
 * the base [Extension]{@link module:extension~Extension} superclass that serves
 * to coordinate the loading and initialization of the <code>Droid</code> bot
 * application's command functionality. This plugin is used by the server's
 * members to interact with the bot in various text channels, with associated
 * functionality ranging from the handling of verification requests to the
 * processing of users' requests for information pertaining to a given user on
 * the wiki.
 * <br />
 * <br />
 * As with all subclasses extending <code>Extension</code>, the
 * <code>Commander</code> class includes an implementation of the required
 * [Extension#onMessage]{@link module:extension~Extension#onMessage} method.
 * This method serves as the event listener callback function that is attached
 * to "message" events by the [Client]{@link module:client~Client} and invoked
 * when a new message is added to a server channel. This particular
 * implementation of the method checks if the new message includes a command
 * invocation, and handles the request accordingly if it does.
 * @class
 */
class Commander extends Extension {

  /** @inheritdoc */
  constructor (name, loaded, config, lang) {
    super(name, loaded, config, lang);

    /**
     * @description The <code>commands</code> property of the
     * <code>Commander</code> class is an instance of the
     * [Discord.Collection]{@link import('discord.js').Collection} class that is
     * used to store initialized instances of command classes that extend the
     * base [Command]{@link module:command~Command} class. A subclass that
     * extends the base {@link Map} JavaScript structure, it is populated by
     * [loadCommandDir]{@link module:commander~Commander#loadCommandDir},
     * usually at the start of the extension's initialization, though
     * post-initialization additions of command classes is possible.
     * @member {Discord.Collection}
     * @see [Discord.Collection]{@link
      * https://discord.js.org/#/docs/collection/master/class/Collection}
      */
    this.commands = new Discord.Collection();

    // Load all commands and add new instances to commands Collection
    this.loadCommandDir(path.join(__dirname, "lib"));
  }

  /**
   * @description As its name implies, <code>loadCommand</code> is used to
   * create a new class instance of the given command class specified in the
   * <code>file</code> parameter and add that newly created instance to the
   * <code>Commander</code> instance's <code>Discord.Collection</code> map
   * [Commander#commands]{@link module:commander~Commander#commands} for
   * subsequent retrieval and usage. It is primarily invoked within the context
   * of [loadCommandDir]{@link module:commander~Commander#loadCommandDir} during
   * the extension's initialization, though it may be invoked independently by
   * [onMessage]{@link module:commander~Commander#onMessage} if the command has
   * somehow not been loaded previously.
   * @function
   * @param {string} file - The name of the requested command to load (should
   * come suffixed with "<code>.js</code>" in all cases)
   * @param {string} [dir=path.join(__dirname, "lib")] - Directory
   * name in which the parameter command file may be found (default is
   * <code>./src/extensions/commander/lib</code>)
   * @returns {void}
   */
  loadCommand (file, dir = path.join(__dirname, "lib")) {

    // Get module exports of requested command file
    const Command = require(path.join(dir, file));

    // Command#name field value from name of the JS file in question
    const name = file.split(".")[0];

    // Command subclass-specific bot messages from this.lang.commands
    const lang = this.lang[name];

    // Instantiate new instance of command class and mark as unloaded
    const command = new Command(name, false, this.config, lang);

    if (this.config.utility.debug) {
      console.log(`${command.name} -> ${this.commands.has(command.name)}`);
    }

    // Add new command to map if not already extant and mark as loaded
    if (!this.commands.has(command.name) && !command.loaded) {
      this.commands.set(command.name, command);
      command.loaded = true;
    }
  }

  /**
   * @description The <code>loadCommandDir</code> method is used to fetch the
   * <code>string</code> names representing files stored in the parameter
   * directory, filter out those that are not properly suffixed "js" JavaScript
   * modules, and invoke [loadCommand]{@link module:client~Client#loadCommand}
   * on those those for the purposes of populating the <code>Client</code> class
   * instance's <code>Discord.Collection</code> map.
   * @function
   * @param {string} [dir=path.join(__dirname, "lib")] - Directory
   * name in which the parameter command file may be found (default is
   * <code>./src/extensions/commander/lib</code>)
   * @returns {void}
   */
  loadCommandDir (dir = path.join(__dirname, "lib")) {
    fs.readdirSync(dir).filter((file) => {
      return file.endsWith(".js");
    }).forEach((file) => this.loadCommand(file, dir));
  }

  /**
   * @description Arguably the most important method of the <code>Client</code>
   * class, <code>onMessage</code> serves as the primary event listener callback
   * handling "message" events. As such, it is responsible for checking to see
   * if the bot application should take an interest in the most recent message,
   * namely the [Discord.Message]{@link
    * http://discord.js.org/#/docs/main/master/class/Message} instance that is
    * passed as the method's sole parameter. If the message is determined to
    * constitute a command invocation, the method will check to see if a command
    * matching the invoked name exists in [Client#commands]{@link
    * module:client~Client#commands}, the [Discord.Collection]{@link
    * https://discord.js.org/#/docs/collection/master/class/Collection}
    * containing all previously instantiated command subclasses corresponding to
    * available command functionality. If so, the method invokes the relevant
    * implementation of [Command#execute]{@link module:command~Command#execute}
    * to pass the execution progression off to the relevant subclass.
    * <br />
    * <br />
    * On a more detailed level, the method begins by checking if the user has
    * attempted to post a non-verification message in the verify channel, logging
    * the message in the moderator logs channel if so before deleting the message
    * and adding a timed reply in response. Otherwise, if the message was a
    * normal user post in another channel rather than a command invocation, the
    * method ignores it and returns to await the next message.
    * <br />
    * <br />
    * However, if the message does constitute a wellformed command invocation,
    * the method will validate the input and attempt to locate an available
    * command matching the desired command. If one is found, the method will then
    * query <code>Client#commands</code> to see if an instance of the appropriate
    * command subclass extending [Command]{@link module:command~Command} exists,
    * invoking [Client#loadCommand]{@link module:client~Client#loadCommand} if
    * not. Execution is then handed off to the <code>Command#execute</code>
    * method to address the required command action.
    * @function
    * @param {Object} message - A new <code>Discord.Message</code> class instance
    * containing information pertaining to the most recent server message, its
    * author, and the channel in which it was posted, among other data.
    * @returns {void}
    */
  onMessage (message) {
    const commands = this.config.commands;
    const lang = this.lang.client;

    /*
     * Take no further interest if the poster is a bot (avoid instant
     * self-deletion of above timed replies) or if the message doesn't start
     * with the command prefix.
     */
    if (!message.content.startsWith(commands.prefix) || message.author.bot) {
      return;
    }

    // Remove prefix and convert to array of strings, i.e. ["verify", "Sebolto"]
    const args = message.content.slice(commands.prefix.length).split(/ +/);

    // Remove command text ("ping", "verify") from args array and lowercase it
    const invokedCommand = args.shift().toLowerCase();

    if (this.config.utility.debug) {
      console.log(args, invokedCommand);
    }

    // Check that invoked command is actually an implemented command subclass
    const command = Object.keys(commands.names).find(key => {
      return commands.names[key] === invokedCommand;
    });

    // Handle nonexistent command invocations
    if (!command) {
      return this.addReply(message, lang.error.nonexistent);
    }

    /*
     * Check if the <code>Client</code> instance's
     * <code>Discord.Collection</code> (extends <code>Map</code>) already has
     * the queried command, implying that <code>loadCommand</code> has already
     * been invoked and a new instance of this command's class created and
     * stored.
     */
    if (!this.commands.has(command)) {
      try {
        this.loadCommand(`${command}.js`);
      } catch (error) {
        return console.error(lang.error.error, error);
      }
    }

    // Acquire class instance and invoke the execute method
    this.commands.get(command).execute(message, args, this.addReply.bind(this));
  }
}

module.exports = Commander;