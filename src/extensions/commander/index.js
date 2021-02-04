"use strict";

/** @const {Object} path - Path module */
const path = require("path");

/** @const {Object} Extension - Extension module, returns class */
const Extension = require("../../../src/util/extension.js");

class Commander extends Extension {

  constructor (name, loaded, config, lang) {
    super(name, loaded, config, lang);

    /**
     * @description The <code>commands</code> property of the
     * <code>Client</code> class is an instance of the
     * [Discord.Collection]{@link import('discord.js').Collection} class that is
     * used to store initialized instances of command classes that extend the
     * base [Command]{@link module:command~Command} class. A subclass that
     * extends the base {@link Map} JavaScript structure, it is populated by
     * [loadCommand]{@link module:client~Client#loadCommand}, usually at the
     * start of the application's initialization, though post-initialization
     * additions of command classes is possible.
     * @member {Discord.Collection}
     * @see [Discord.Collection]{@link
      * https://discord.js.org/#/docs/collection/master/class/Collection}
      */
    this.commands = new Discord.Collection();

    this.loadCommandDir(path.join(__dirname, "lib"));
  }

  /**
   * @description As its name implies, <code>loadCommand</code> is used to
   * create a new class instance of the command class specified in the
   * <code>file</code> parameter and add that newly created instance to the
   * <code>Client</code> instance's <code>Discord.Collection</code> map for
   * subsequent retrieval and usage.
   * @function
   * @param {string} file - The name of the requested command to load (should
   * come suffixed with "<code>.js</code>" in all cases)
   * @param {string} [dir=path.join(__dirname, "lib")] - Directory
   * name in which the parameter command file may be found (default is
   * <code>./commands/lib</code>)
   * @returns {void}
   */
  loadCommand (file, dir = path.join(__dirname, "lib")) {

    // Get module exports of requested command file
    const Command = require(path.join(dir, file));

    // Command#name field value from name of the JS file in question
    const name = file.split(".")[0];

    // Command subclass-specific bot messages from this.lang.commands
    const lang = this.lang.commands[name];

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
   * @param {string} dir - Directory <code>Array</code> of <code>string</code>
   * file names (<code>./src/commands/lib</code> when invoked by
   * {@link index.js})
   * @returns {void}
   */
  loadCommandDir (dir) {
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