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
    this.extensions = new Discord.Collection();

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

    // Load extensions and populate Collection with objects
    this.loadExtensionDir(path.join(__dirname, "extensions"));

    // Set default event listeners and associated callbacks
    this.client.on("ready", this.onReady.bind(this));
    this.client.on("error", this.onError.bind(this));

    // Set custom event listeners on new message
    this.extensions.forEach(extension => {
      this.client.on("message", extension.onMessage.bind(extension));
    });
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

  loadExtension (file, dir) {

  }

  loadExtensionDir (dir) {
    fs.readdirSync(dir).filter((file) => {
      return file.endsWith("index.js");
    }).forEach((file) => this.loadExtension(file, dir));
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