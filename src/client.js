// @ts-check
/**
 * @file The <code>client</code> module serves to encapsulate the class of the
 * same name. The <code>Client</code> class represents the most important class
 * of the application, as it is directly responsible for coordinating responses
 * to user command invocations, logging replies in the server channels, and
 * establishing and maintaining a connection to Discord via websocket. It could
 * be viewed as a tacit extending subclass of <code>Discord.Client</code>.
 * @module client
 * @author Andrew Eissen <andrew@andreweissen.com>
 * @requires fs
 * @requires path
 * @requires discord.js
 */
"use strict";

/** @const {Object} fs - File system module */
const fs = require("fs");

/** @const {Object} path - Path module */
const path = require("path");

/** @const {Object} Discord - Discord.js module (class) */
const Discord = require("discord.js");

// @ts-check
/**
 * @classdesc The <code>Client</code> class serves as the beating heart of the
 * application of the same name. It is responsible for coordinating the behavior
 * of the bot, loading commands, evaluating each new message posted to server
 * channels, and replying to user queries as required.
 * <br />
 * <br />
 * As the central class of the bot application, <code>Client</code> is the only
 * class that may interact with other users in the server channels through the
 * posting of messages. In previous versions of the application, various command
 * subclasses extending [Command]{@link module:command~Command} would likewise
 * post messages in the server. However, this spaghetti approach was eventually
 * refactored and replaced with the passing of each subclass a reference to
 * [addReply]{@link module:client~Client#addReply} bound to the
 * <code>Client</code> class instance to ensure all message logging remained
 * during the exclusive purview of the central <code>Client</code> class.
 * @class
 */
class Client {

  /**
   * @description The <code>Client</code> class constructor, invoked by
   * index.js, is responsible for creating new <code>Discord.Client</code> and
   * <code>Discord.Collection</code> instances, defining resource objects that
   * contain various operation properties and raw message text, setting various
   * status <code>boolean</code> flags, and establishing event listeners and
   * their associated callbacks.
   * @param {string} token - A process environment variable representing the
   * Discord application's client ID/bot token provided by Discord when first
   * converting an application to a bot.
   * @param {Object} config - The implementation-specific configuration options
   * available for adjustment prior to installation, generally stored in
   * <code>/resources/config.json</code> and passed by <code>index.js</code>.
   * @param {Object} lang - The text of all possible server replies and console
   * messages available to the bot, generally stored in
   * <code>/resources/lang.json</code> and passed by <code>index.js</code>.
   * @constructor
   */
  constructor (token, config, lang) {

    /**
     * @description The <code>token</code> property is a process environment
     * variable representing the Discord application's client ID/bot token
     * provided by Discord when first converting an application to a bot, the
     * value of which is obfuscated as a process variable stored in an
     * <code>env</code> file hidden by <code>.gitignore</code>.
     * @member {string}
     */
    this.token = token;

    /**
     * @description The <code>config</code> <code>Object</code> serves to
     * compartmentalize certain configuration properties that may vary and
     * change depending on application implementation context. Such properties
     * include the Discord application ID/bot token, the value of which is
     * obfuscated as a process variable stored in an <code>env</code> file that
     * is hidden by <code>.gitignore</code>, the specific <code>string</code>
     * prefix that precedes command invocations, and the interval duration that
     * governs how long the application should wait before automatically
     * deleting bot replies to user commands.
     * @member {Object}
     */
    this.config = config;

    /**
     * @description The <code>lang</code> <code>Object</code> contains all the
     * raw text content of messages the <code>Client</code> class instance will
     * generate in the server channels by means of [Client#addReply]{@link
     * module:client~Client#addReply}. Unlike the contents of the
     * [Client#config]{@link module:client~Client#config} <code>Object</code>,
     * the <code>lang</code> property should not be configured by the installing
     * user or have its properties adjusted in any way apart from the submission
     * of modifications made to the text values of the JSON keys.
     * @member {Object}
     */
    this.lang = lang;

    /**
     * @description The <code>client</code> property of the <code>Client</code>
     * class is an instance of the
     * [Discord.Client]{@link import('discord.js').Client} class that serves as
     * the main interface of the discord.js module and the primary means by
     * which the Client application interacts with the Discord API. Its methods
     * are invoked to establish the event listener handlers and callbacks
     * responsible for monitoring user messages posted to server channels and
     * handles changes to the application's status.
     * @member {Discord.Client}
     * @see [Discord.Client]{@link
     * https://discord.js.org/#/docs/main/master/class/Client}
     */
    this.client = new Discord.Client();

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

    /**
     * @description The <code>_loggedIn</code> <code>boolean</code> property is
     * a private internal field used to indicate whether the application is
     * already active and logged in. The method responsible for setting this
     * flag is [Client#login]{@link module:client~Client#login}, which sets the
     * flag after invoking [Client#client's]{@link module:client~Client#client}
     * own [Discord.Client#login]{@link
     * https://discord.js.org/#/docs/main/master/class/Client?scrollTo=login}
     * method used to establish a Websocket connection to Discord.
     * @member {boolean}
     */
    this._loggedIn = false;

    /**
     * @description The <code>_debug</code> <code>boolean</code> property is a
     * private internal field used to display certain information in the console
     * when its value is set to <code>true</code>. As its name implies, it
     * toggles the <code>Client</code> class's debug mode to assist in debugging
     * and application diagnosis.
     * @member {boolean}
     */
    this._debug = true;

    // Set event listeners and associated callbacks
    this.client.on("ready", this.onReady.bind(this));
    this.client.on("error", this.onError.bind(this));
    this.client.on("message", this.onMessage.bind(this));
  }

  /**
   * @description <code>set token</code> serves as the setter method for the
   * <code>token</code> parameter property representing the bot client ID token.
   * It checks to ensure that the parameter <code>token</code> is of the
   * primitive <code>string</code> type or the <code>String</code> wrapper
   * <code>Object</code>, applying an empty string to the internal field if
   * the parameter is not of the proper type.
   * @function
   * @param {string|String} token - The parameter to be assigned as the internal
   * <code>_token</code>. It should be a primitive <code>string</code> or an
   * <code>Object</code> of the <code>String</code> wrapper class.
   * @returns {void}
   */
  set token (token) {
    // @ts-ignore
    this._token = typeof token === "string" || token instanceof String
      ? token
      : "";
  }

  /**
   * @description <code>set config</code> serves as the setter method for the
   * <code>config</code> parameter property containing the custom configuration
   * options available for tweaking prior to installation of the application. It
   * checks to ensure that the parameter <code>config</code> is of the
   * <code>Object</code> type, applying a default empty <code>Object</code> to
   * the internal field if the parameter is not of the proper type.
   * @function
   * @param {Object} config - The parameter to be assigned as the internal
   * <code>_config</code>. It should be a primitive <code>Object</code>.
   * @returns {void}
   */
  set config (config) {
    this._config = typeof config === "object" && config.constructor === Object
      ? Object.freeze(config)
      : {};
  }

  /**
   * @description <code>set lang</code> serves as the setter method for the
   * <code>lang</code> parameter property containing the text of all possible
   * messages the greater bot application can log in server channels. It checks
   * to ensure that the parameter <code>config</code> is of the
   * <code>Object</code> type, applying a default empty <code>Object</code> to
   * the internal field if the parameter is not of the proper type.
   * @function
   * @param {Object} lang - The parameter to be assigned as the internal
   * <code>_lang</code>. It should be a primitive <code>Object</code>.
   * @returns {void}
   */
  set lang (lang) {
    this._lang = typeof lang === "object" && lang.constructor === Object
      ? Object.freeze(lang)
      : {};
  }

  /**
   * @description <code>get token</code> serves as the getter method for the
   * <code>token</code> property. It simply returns the value of the internal
   * field, be that the parameter value passed to the constructor during
   * initialization or the default empty <code>string</code> value.
   * @function
   * @returns {string} _token - Value of the internal <code>string</code>
   */
  get token () {
    return this._token;
  }

  /**
   * @description <code>get config</code> serves as the getter method for the
   * <code>config</code> property. It simply returns the value of the internal
   * field, be that the parameter value passed to the constructor during
   * initialization or the default empty <code>Object</code>.
   * @function
   * @returns {Object} _config - Value of the internal <code>Object</code>
   */
  get config () {
    return this._config;
  }

  /**
   * @description <code>get lang</code> serves as the getter method for the
   * <code>lang</code> property. It simply returns the value of the internal
   * field, be that the parameter value passed to the constructor during
   * initialization or the default empty <code>Object</code>.
   * @function
   * @returns {Object} _lang - Value of the internal <code>Object</code>
   */
  get lang () {
    return this._lang;
  }

  /**
   * @description <code>onReady</code> simply logs a message in the console
   * when the application has been successfully initialized and a Websocket
   * connection established with Discord.
   * @function
   * @returns {void}
   */
  onReady () {
    return console.log(this.lang.client.success.online);
  }

  /**
   * @description As with <code>onReady</code>, <code>onError</code> logs the
   * relevant error code with the error message in the console for debugging.
   * @function
   * @param {*} error - Error code for logging with default error message
   * @returns {void}
   */
  onError (error) {
    return console.error(this.lang.client.error.error, error);
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
    const channels = this.config.channels;
    const lang = this.lang.client;

    /*
     * If the posting user is not a bot and is posting non-verification messages
     * in the Verify channel, the application will post the contents of that
     * message in the moderator-restricted "logs" channel as an attributed
     * indented quotation before deleting the original message from the verify
     * channel. The bot will then post a follow-up reply addressed to the user
     * that informs of the channel's intended purposes. This reply will
     * self-delete after the provided interval.
     */
    if (
      !message.author.bot &&
      (message.channel.id === channels.verify) &&
      (!message.content.startsWith(commands.prefix + commands.names.verify))
    ) {
      // Post in Chat Moderator "logs" channel
      message.client.channels.cache.get(channels.logs).send(
        `${message.author.tag}:\n> ${message.content}`
      );

      // Add self-deleting informational message
      return this.addReply(message, lang.error.unrelated);
    }

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

    if (this._debug) {
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

  /**
   * @description The <code>addReply</code> method is used to log a new reply
   * directed at the user invoking the given command that provides information
   * about the state of the request. A copy of this function bound to the
   * <code>Client</code> class instance to which the method belongs is passed to
   * each command subclasses's [execute]{@link Command#execute} method to
   * ensure that the <code>Client</code> class is the only module to interact
   * with the server channels. Subclasses extending [Command]{@link Command}
   * should only contain application logic related to those commands, leaving
   * the posting of results to this method.
   * @function
   * @param {Object} message - A new [Discord.Message]{@link
   * http://discord.js.org/#/docs/main/master/class/Message} class instance
   * containing information pertaining to the most recent server message, its
   * author, and the channel in which it was posted, among other data.
   * @param {string} langMessage - The text of the specific message to log,
   * generally a relevant property of [lang]{@link module:client~Client#lang}.
   * @param {boolean} [deleteMessages=true] - A <code>boolean</code> flag
   * denoting whether to delete the poster's original message and the bot's
   * reply after the interval defined in [config]{@link
   * module:client~Client#config} has elapsed. This optional field is set to
   * <code>true</code> by default.
   * @returns {void}
   */
  addReply (message, langMessage, deleteMessages = true) {
    if (deleteMessages) {
      message.delete();
    }

    // Direct reponse to the user directly
    message.reply(langMessage).then(msg => {
      if (deleteMessages) {
        msg.delete({
          timeout: this.config.utility.interval
        });
      }
    }).catch(console.error);
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
   * @param {string} [dir=path.join(__dirname, "commands", "lib")] - Directory
   * name in which the parameter command file may be found (default is
   * <code>./commands/lib</code>)
   * @returns {void}
   */
  loadCommand (file, dir = path.join(__dirname, "commands", "lib")) {

    // Get module exports of requested command file
    const Command = require(path.join(dir, file));

    // Command#name field value from name of the JS file in question
    const name = file.split(".")[0];

    // Command subclass-specific bot messages from this.lang.commands
    const lang = this.lang.commands[name];

    // Instantiate new instance of command class and mark as unloaded
    const command = new Command(name, false, this.config, lang);

    if (this._debug) {
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
   * @description The <code>login</code> method is used primarily to invoke the
   * <code>Discord.Client</code> method of the same name in a safe manner that
   * precludes the possibility of double loads. <code>Discord.Client</code>'s
   * <code>login</code> method should only be called once, after which the
   * <code>Client</code> class instance's relevant private <code>boolean</code>
   * flag should be set to <code>true</code> to indicate the login was
   * successful.
   * @function
   * @see [Discord.Client#login]{@link
   * https://discord.js.org/#/docs/main/master/class/Client?scrollTo=login}
   * @param {string} [token=this.token] - The value of the process environment
   * variable <code>TOKEN</code>, referring to the Discord application's client
   * ID/bot token, provided by Discord when first converting an application to a
   * bot.
   * @returns {void}
   */
  login (token = this.token) {
    if (this._loggedIn) {
      throw new Error(this.lang.client.error.login);
    }

    this._loggedIn = true;
    this.client.login(token);
  }
}

module.exports = Client;