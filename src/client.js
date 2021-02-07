// @ts-check
/**
 * @file The <code>client</code> module serves to encapsulate the class of the
 * same name. The <code>Client</code> class represents the most important class
 * of the application, as it is directly responsible for coordinating responses
 * to user command invocations, logging replies in the server channels, and
 * establishing and maintaining a connection to Discord via websocket. It could
 * be viewed as a tacitly extending subclass of <code>Discord.Client</code>.
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
 * @classdesc Though much of its original functionality has since been delegated
 * to more specialized classes by means of the recent rewrite, the
 * <code>Client</code> class still tacitly serves as the beating heart of the
 * application. It is responsible for initializing and coordinating the behavior
 * of the bot, loading extensions, and logging in via websocket. Prior to its
 * rewrite, it also handled the responsibilities of loading commands, monitoring
 * certain server channels, and responding to user queries as required.
 * <br />
 * <br />
 * As the central class of the bot application, <code>Client</code> was
 * previously the only class empowered to interact with other users in the
 * server channels through the posting of messages. In previous versions of the
 * application, various command subclasses extending [Command]{@link
 * module:command~Command} could likewise post messages in the server. However,
 * this spaghetti approach was eventually refactored and replaced with the
 * passing of each subclass a reference to a dedicated response methdo bound to
 * the <code>Client</code> class instance to ensure all message logging remained
 * during the exclusive purview of the central <code>Client</code> class.
 * <br />
 * <br />
 * However, as of the most recent rewrite (February 2021), the class's reply
 * method was instead moved to [Extension]{@link module:extension~Extension} and
 * named [addReply]{@link module:extension~Extension#addReply}. This method is
 * now available to all implementing subclasses of <code>Extension</code>,
 * leaving the posting of messages as the responsibility of extensions
 * themselves. The previous approach of passing a bound version of the reply
 * method to <code>Command</code> subclasses was retained, as [Commander]{@link
 * module:commander~Commander} now passes its <code>addReply</code> method to
 * its commands.
 * @class
 */
class Client {

  /**
   * @description The <code>Client</code> class constructor, invoked by
   * index.js, is responsible for creating new <code>Discord.Client</code> and
   * <code>Discord.Collection</code> instances, defining resource objects that
   * contain various operation properties and raw message text, setting various
   * status <code>boolean</code> flags, loading extensions, and establishing
   * event listeners and their associated callbacks.
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
     * generate in the server channels by means of [Extension#addReply]{@link
     * module:extension~Extension#addReply}. Like the contents of the
     * [Client#config]{@link module:client~Client#config} <code>Object</code>,
     * the <code>lang</code> property may be configured by the installing
     * user via the inclusion of an identically named file in the root
     * directory.
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
     * @description The <code>extensions</code> property of the
     * <code>Client</code> class is an instance of the
     * [Discord.Collection]{@link import('discord.js').Collection} class that is
     * used to store initialized instances of extension classes that extend the
     * base [Command]{@link module:extension~Extension} class. A subclass that
     * extends the base {@link Map} JavaScript structure, it is populated by
     * [loadCommand]{@link module:client~Client#loadExtensionDir}, usually at
     * the start of the application's initialization, though post-initialization
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

    // Set default event listeners and associated callbacks
    this.client.on("ready", this.onReady.bind(this));
    this.client.on("error", this.onError.bind(this));
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
   * <code>_config</code>. It should be an <code>Object</code>.
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
   * <code>_lang</code>. It should be an <code>Object</code>.
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
   * @description The <code>loadExtensionDir</code>, as its name implies, is
   * used to load the various extensions that extend the [Extension]{@link
   * module:extension~Extension} class. It is written much like the
   * [loadCommand]{@link module:commander~Commander#loadCommand} method from
   * which it originated, in that it requires the <code>js</code> file
   * constituting the extension application logic, partitions off the part of
   * the <code>lang.json</code> <code>object</code> relating to the extension in
   * question, instantiates a new extension class, and checks for duplicates
   * already in [Client#extensions]{@link module:client~Client#extensions}.
   * Finally, the method adds the instance to the <code>Collection</code>, marks
   * it as loaded, and attaches its [onMessage]{@link
   * module:extension~Extension#onMessage} as a dedicated event listener.
   * @function
   * @see [Commander#loadCommand]{@link module:commander~Commander#loadCommand}
   * @param {string} [dir=path.join(__dirname, "extensions")] - The directory
   * in which the extension directories are stored; by convention, this is
   * <code>./src/extensions</code>
   * @returns {void}
   */
  loadExtensionDir (dir = path.join(__dirname, "extensions")) {
    fs.readdirSync(dir).forEach((file) => {

      // Search each extension directory for index.js file
      const Extension = require(path.join(dir, file));

      // Extension-specific lang from lang.json
      const lang = this.lang[file];

      // Instantiate new instance of extension class and mark as unloaded
      const extension = new Extension(file, false, this.config, lang);

      // Debug
      if (this.config.utility.debug) {
        console.log(`${file} -> ${this.extensions.has(file)}`);
      }

      // Add new extension to Collection if not present and mark as loaded
      if (!this.extensions.has(extension) && !extension.loaded) {

        // Add to collection with string name as key
        this.extensions.set(extension.name, extension);

        // Add event listener for new messages
        this.client.on("message", extension.onMessage.bind(extension));

        // Mark as fully loaded
        extension.loaded = true;
      }
    });
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