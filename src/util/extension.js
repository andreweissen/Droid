"use strict";

class Extension {
  constructor (name, loaded, config, lang) {
    this.name = name;
    this.loaded = loaded;
    this.config = config;
    this.lang = lang;
  }

  set name (name) {
    this._name = typeof name === "string" || name instanceof String ? name : "";
  }

  set loaded (loaded) {
    this._loaded = typeof loaded === "boolean" ? loaded : false;
  }

  set config (config) {
    this._config = typeof config === "object" && config.constructor === Object
      ? config
      : {};
  }

  set lang (lang) {
    this._lang = typeof lang === "object" && lang.constructor === Object
      ? lang
      : {};
  }

  get name () {
    return this._name;
  }

  get loaded () {
    return this._loaded;
  }

  get config () {
    return this._config;
  }

  get lang () {
    return this._lang;
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

  onMessage (message) {}
}

module.exports = Extension;