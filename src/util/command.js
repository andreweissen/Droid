// @ts-check
/**
 * @file The <code>command</code> module (there's an Apollo space program joke
 * in there somewhere) serves to encapsulate the class of the same name. The
 * <code>Command</code> class serves as a largely content-free superclass that
 * is extended by subsequent subclasses representing specific commands users
 * may invoke on the server.
 * @module command
 * @author Andrew Eissen <andrew@andreweissen.com>
 */
"use strict";

/**
 * @classdesc The <code>Command</code> class serves as a framework class whose
 * sole purpose is to permit extension by more specific command classes. The
 * most important member is the unimplemented method, [Command#execute]{@link
 * Command#execute}, which all extending classes are required to implement. This
 * method is called whenever a command is invoked in a server channel, and
 * contains the application logic responsible for processing the implementation
 * of that particular command. The other methods and members belonging to the
 * <code>Command</code> class are the various private properties and their
 * setter/getter methods. Other extending classes may implement their own
 * private prototype methods as needed, but <code>Command</code> exists solely
 * for subsequent extension and thus lacks its own dedicated functionality.
 * @class
 */
class Command {

  /**
   * @description The <code>Command</code> constructor is used simply to store
   * the <code>string</code>, <code>boolean</code>, and <code>Object</code>
   * parameter properties passed during the class's initial initialization
   * (via [loadCommand]{@link module:commander~Commander#loadCommand}) in
   * private fields via dedicated setters that ensure parameters are of the
   * correct data type.
   * @constructor
   * @param {string} name - Name of the command (verify, about, etc.), not the
   * specific configurable text the user must use to invoke the command.
   * @param {boolean} loaded - Flag denoting the command's loaded or unloaded
   * status, depending on whether a class instance already exists in the
   * <code>Commander</code> instance's <code>Discord.Collection</code> map,
   * namely [Commander#commands]{@link module:commander~Commander#commands}.
   * @param {Object} config - Ultimately, a reference to the original
   * [Client#config]{@link module:client~Client#config} <code>Object</code> that
   * is likewise passed to each extension and command on initialization. This
   * parameter contains all the custom configuration options available for
   * tweaking prior to installation.
   * @param {Object} lang - A reference to a command-specific property of the
   * <code>Commander</code> plugin's [lang]{@link
   * module:commander~Commander#lang} property, which is itself a property of
   * the <code>Client</code> class's own [lang]{@link module:client~Client#lang}
   * <code>Object</code> specific to the <code>Commander</code> extension.
   */
  constructor (name, loaded, config, lang) {

    /**
     * @description The <code>name</code> <code>string</code> property is a
     * private internal field representing the name of the specific command
     * being initialized rather than the configurable text the user must
     * reference when invoking the command in question.
     * @member {string}
     */
    this.name = name;

    /**
     * @description The <code>loaded</code> <code>boolean</code> property is a
     * private internal field denoting whether a class instance of its type
     * exists in the <code>Commander</code>'s [Discord.Collection]{@link
     * https://discord.js.org/#/docs/collection/master/class/Collection}
     * property, [commands]{@link module:commander~Commander#commands}.
     * @member {boolean}
     */
    this.loaded = loaded;

    /**
     * @description The <code>config</code> <code>Object</code> property is
     * ultimately a reference to the original [Client#config]{@link
     * module:client~Client#config} <code>Object</code> that is likewise passed
     * to each extension and command on their initializations. This parameter is
     * the container for all the custom configuration options available for
     * tweaking prior to the installation of the application.
     * @member {Object}
     * @see [Client#config]{@link module:client~Client#config}
     */
    this.config = config;

    /**
     * @description The <code>lang</code> <code>Object</code> property is a
     * reference to a command-specific property of the <code>Commander</code>
     * plugin's [lang]{@link module:commander~Commander#lang} property, which is
     * itself a property of the <code>Client</code> class's own [lang]{@link
     * module:client~Client#lang} <code>Object</code> specific to the
     * <code>Commander</code> extension.
     * @member {Object}
     * @see [Commander#lang]{@link module:commander~Commander#lang}
     * @see [Client#lang]{@link module:client~Client#lang}
     */
    this.lang = lang;
  }

  /**
   * @description <code>set name</code> serves as the setter method for the
   * <code>name</code> parameter property representing the name of the command.
   * It checks to ensure that the parameter <code>name</code> is of the
   * primitive <code>string</code> type or the <code>String</code> wrapper
   * <code>Object</code>, applying an empty string to the internal field if
   * the parameter is not of the proper type.
   * @function
   * @param {string|String} name - The parameter to be assigned as the internal
   * <code>_name</code>. It should be a primitive <code>string</code> or an
   * <code>Object</code> of the <code>String</code> wrapper class.
   * @returns {void}
   */
  set name (name) {
    // @ts-ignore
    this._name = typeof name === "string" || name instanceof String ? name : "";
  }

  /**
   * @description <code>set loaded</code> serves as the setter method for the
   * <code>loaded</code> parameter property representing whether the commands
   * extension has already instantiated a member of the class and added it to
   * the <code>Commander</code>'s own [Discord.Collection]{@link
   * https://discord.js.org/#/docs/collection/master/class/Collection} property,
   * [commands]{@link module:commander~Commander#commands}. It checks to ensure
   * that the parameter <code>loaded</code> is of the primitive
   * <code>boolean</code> type, applying a default value of <code>false</code>
   * to the internal field if the parameter is not of the proper type.
   * @function
   * @param {boolean} loaded - The parameter to be assigned as the internal
   * <code>_loaded</code>. It should be a primitive <code>boolean</code>.
   * @returns {void}
   */
  set loaded (loaded) {
    this._loaded = typeof loaded === "boolean" ? loaded : false;
  }

  /**
   * @description <code>set config</code> serves as the setter method for the
   * <code>config</code> parameter property representing a reference to the
   * original <code>Client</code> class instance's own [config]{@link
   * module:client~Client#config} <code>Object</code>, the container for all the
   * custom configuration options available for tweaking prior to the
   * installation of the application. It checks to ensure that the parameter
   * <code>config</code> is of the <code>Object</code> type, applying a default
   * empty <code>Object</code> to the internal field if the parameter is not of
   * the proper type.
   * @function
   * @param {Object} config - The parameter to be assigned as the internal
   * <code>_config</code>. It should be an <code>Object</code>.
   * @returns {void}
   */
  set config (config) {
    this._config = typeof config === "object" && config.constructor === Object
      ? config
      : {};
  }

  /**
   * @description <code>set lang</code> serves as the setter method for the
   * <code>lang</code> parameter property representing a reference to the
   * command-specific property of the <code>Commander</code> plugin's
   * [lang]{@link module:commander~Commander#lang} property, which is itself a
   * property of the <code>Client</code> class's own [lang]{@link
   * module:client~Client#lang} <code>Object</code> specific to the
   * <code>Commander</code> extension. It checks to ensure that the parameter
   * <code>config</code> is of the <code>Object</code> type, applying a default
   * empty <code>Object</code> to the internal field if the parameter is not of
   * the proper type.
   * @function
   * @param {Object} lang - The parameter to be assigned as the internal
   * <code>_lang</code>. It should be an <code>Object</code>.
   * @returns {void}
   */
  set lang (lang) {
    this._lang = typeof lang === "object" && lang.constructor === Object
      ? lang
      : {};
  }

  /**
   * @description <code>get name</code> serves as the getter method for the
   * <code>name</code> property. It simply returns the value of the internal
   * field, be that the parameter value passed to the constructor during
   * initialization or the default empty <code>string</code> value.
   * @function
   * @returns {string} _name - Value of the internal <code>string</code>
   */
  get name () {
    return this._name;
  }

  /**
   * @description <code>get loaded</code> serves as the getter method for the
   * <code>loaded</code> property. It simply returns the value of the internal
   * field, be that the parameter value passed to the constructor during
   * initialization or the default <code>false</code> value.
   * @function
   * @returns {boolean} _loaded - Value of the internal <code>boolean</code>
   */
  get loaded () {
    return this._loaded;
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
   * @description The default <code>execute</code> function is left
   * unimplemented by default in the <code>Command</code> superclass, with the
   * expectation that extending subclasses be the ones to implement this
   * function. It is the most important method of the respective classes, as it
   * is the method invoked when users themselves invoke a command in the Discord
   * server. It coordinates the application logic of the specific command, and
   * may invoke other subclass-specific helper methods as required.
   * @function
   * @param {Object} message - A new [Discord.Message]{@link
   * http://discord.js.org/#/docs/main/master/class/Message} class instance
   * containing information pertaining to the most recent server message, its
   * author, and the channel in which it was posted, among other data.
   * @param {Array<string>} args - An array of <code>string</code>s constituting
   * the arguments that follow the initial command invocation. In the case of
   * verifications and "!about" queries, these arguments are the words that make
   * up the username as separated by spaces; for example, the username "Jabba
   * the Hutt" would be passed as <code>["Jabba", "the", "Hutt"]</code> as the
   * <code>args</code> argument.
   * @param {Function} logReply - A reference to the <code>Commander</code>
   * extension's own copy of [Extension#addReply]{@link
   * module:extension~Extension#addReply} method, bound to that extension's
   * class instance. This ensures command subclasses are not directly
   * interfacing with the server channels, a responsibility under the exclusive
   * purview of the <code>Commander</code> extension class and its respective
   * methods alone.
   * @returns {void}
   */
  execute (message, args, logReply) {}
}

module.exports = Command;