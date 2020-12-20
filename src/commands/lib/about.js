// @ts-check
/**
 * @file The <code>about</code> module serves to encapsulate the class of the
 * same name. The <code>About</code> class extends the default [Command]{@link
 * module:command~Command} class and handles requests for information about a
 * given user passed as a parameter in the command invocation. The class queries
 * the MediaWiki API for information about the given user, including gender,
 * registration date, date of last edit, user group membership, etc.
 * @module about
 * @author Andrew Eissen <andrew@andreweissen.com>
 * @requires path
 * @requires got
 * @requires command
 */
"use strict";

/** @const {Object} path - Path module */
const path = require("path");

/** @const {Object} got - Got module */
const got = require("got");

/** @const {Command} Command - Command module, returns class */
const Command = require("../util/command.js");

/**
 * @classdesc The <code>About</code> class is a subclass extending the default
 * [Command]{@link module:command~Command} class that handles requests for
 * information pertaining to the given user whose username is passed as the
 * parimary argument. The original implementation of this functionality was more
 * in line with the SWF wiki's old Freenode IRC bot, Jules, which would post a
 * humorous comment in the IRC channel about a queried user.
 * <br />
 * <br />
 * However, the subsequent rewrite of the <code>About</code> command subclass
 * was undertaken with the intention of making the command more useful as a
 * means of acquiring identifying information about a given Wikia/Fandom account
 * without having to manually poke around on the user's userpage. The updated
 * version's design ethos and general layout was based on [Userinfo]{@link
 * https://en.wikipedia.org/wiwki/User:PleaseStand/userinfo.js}, a JavaScript
 * userscript published on the English Wikipedia and developed by Wikipedia
 * user [PleaseStand]{@link https://en.wikipedia.org/wiki/User:PleaseStand}.
 * @class
 * @see [Userinfo]{@link
 * https://en.wikipedia.org/wiwki/User:PleaseStand/userinfo.js}
 */
class About extends Command {

  /**
   * @description <code>getUserInfo</code> is used to return general-purpose
   * data about the Fandom account associated with the parameter username. The
   * query returns data related to the account's user rights groups and
   * associated permissions and information regarding the account's edit count,
   * gender, block data, date of last edit, and registration date. The method
   * queries the [Users]{@link https://www.mediawiki.org/wiki/API:Users} and
   * [Usercontribs]{@link https://www.mediawiki.org/wiki/API:Usercontribs}
   * endpoints to this end.
   * @function
   * @see [Verify#getUserInfo]{@link module:verify~Verify#getUserInfo}
   * @param {string} username - The name of the Fandom account to be queried
   * @returns {Object} - Making use of the <code>got</code> module's
   * <code>Promise.json</code>, the method returns raw JSON data retrieved from
   * the MediaWiki API query rather than a resolved or rejected promise object.
   */
  getUserInfo (username) {
    // @ts-ignore
    return got(path.join(
      `https://${this.config.utility.subdomain}.fandom.com`, "api.php"
    ), {
      searchParams: {
        action: "query",
        list: "users|usercontribs",
        usprop: "blockinfo|editcount|gender|registration|groups",
        uclimit: 1,
        ucprop: "timestamp",
        ususers: username,
        ucuser: username,
        format: "json"
      }
    }).json();
  }

  /**
   * @description <code>formatDate</code> is a helper function employed by
   * [About#timeago]{@link module:about~About#timeago} for the purposes of
   * formatting the calculated time into an English fuzzy date. The method uses
   * regex to separate the raw <code>number</code> passed as the
   * <code>time</code> parameter into groups of three separated by commas and
   * determines whether to include a singular or plural time measurement (i.e.
   * "day" vs "days"). The method is a modification of a similar method first
   * developed by Wikipedia user [PleaseStand]{@link
   * https://en.wikipedia.org/wiki/User:PleaseStand} for his [Userinfo]{@link
   * https://en.wikipedia.org/wiki/User:PleaseStand/userinfo.js} MediaWiki
   * userscript available for use on the English Wikipedia.
   * @function
   * @see [Userinfo]{@link
   * https://en.wikipedia.org/wiwki/User:PleaseStand/userinfo.js}
   * @param {number} time - The raw <code>number</code> representing an amount
   * of time of a certain unit of measurement.
   * @param {Object} langMessage - An <code>Object</code> retrieved from
   * <code>/src/resources/lang.json</code> containing a pair of properties
   * representing the singular and plural forms of the specified unit of time.
   * @returns {string} - The formatted <code>string</code> date in English; i.e.
   * "1,234 years" or "1 hour".
   */
  formatDate (time, langMessage) {

    // Separate number into groups of three separated by commas
    const target = new RegExp("\d{1,3}(?=(\d{3})+(?!\d))", "g");

    // Display singular/plural text depending on number passed as time
    const text = (time === 1) ? langMessage.singular : langMessage.plural;

    // Acquire thousands separator character from lang.json
    const separator = this.lang.success.delimiters.thousands;

    // "1,234 seconds" or "1 day"
    return String(time).replace(target, `$&${separator}`) + "\u00a0" + text;
  }

  /**
   * @description Named in reference to the jQuery plugin [$.timeago]{@link
   * https://github.com/rmm5t/jquery-timeago} available by default on
   * Wikia/Fandom wikis, <code>About#timeago</code> is used as a means of
   * building so-called "fuzzy dates" that estimate in English the amount of
   * time elapsed in a given interval. In such cases, rather than provide an
   * exact amount of milliseconds, the method will convert to readable units of
   * measurement to produce outputs like "15 hours ago" or "10 years 2 months
   * old" for various intervals. This functionality is used by [execute]{@link
   * module:about~About#execute} for the purposes of estimating account ages and
   * durations since a user's last edit.
   * <br />
   * <br />
   * The specific implementation contained in this method is an updated version\
   * of a similar function first developed by Wikipedia user [PleaseStand]{@link
   * https://en.wikipedia.org/wiki/User:PleaseStand} for his [Userinfo]{@link
   * https://en.wikipedia.org/wiki/User:PleaseStand/userinfo.js} MediaWiki
   * userscript available for use on the English Wikipedia.
   * @function
   * @see [Userinfo]{@link
   * https://en.wikipedia.org/wiwki/User:PleaseStand/userinfo.js}
   * @param {Date|*} target - A <code>Date</code> object instance related to a
   * timestamp <code>string</code> passed in MediaWiki API query data from an
   * [About#getUserData]{@link module:about~About#getUserData} invocatin.
   * @returns {string} words - A readable English fuzzy date estimating the
   * amount of time elapsed in the given interval calculated from subtracting
   * the <code>target</code> time from the current time.
   */
  timeago (target) {
    if (typeof target === "string" || !(target instanceof Date)) {
      target = new Date(target);
    }

    // Various unit measurements of time in milliseconds
    const one = Object.freeze({
      second: 1000,
      minute: 60000,
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
      year: 31536000000
    });

    // Declarations
    let number, words, remainder;

    // Milliseconds elapsed since target time
    const timeElapsed = new Date().getTime() - target.getTime();

    // Alias
    const timeLang = this.lang.success.time;

    if (timeElapsed < one.minute) {
      number = Math.floor(timeElapsed / one.second);
      words = this.formatDate(number, timeLang.second);
    } else if (timeElapsed < one.hour) {
      number = Math.floor(timeElapsed / one.minute);
      words = this.formatDate(number, timeLang.minute);
    } else if (timeElapsed < one.day) {
      number = Math.floor(timeElapsed / one.hour);
      words = this.formatDate(number, timeLang.hour);
      remainder = Math.floor((timeElapsed - number * one.hour) / one.minute);

      if (remainder) {
        words += "\u00a0" +  this.formatDate(remainder, timeLang.minute);
      }
    } else if (timeElapsed < one.week) {
      number = Math.floor(timeElapsed / one.day);
      words = this.formatDate(number, timeLang.day);
    } else if (timeElapsed < one.month) {
      number = Math.floor(timeElapsed / one.week);
      words = this.formatDate(number, timeLang.week);
    } else if (timeElapsed < one.year) {
      number = Math.floor(timeElapsed / one.month);
      words = this.formatDate(number, timeLang.month);
    } else {
      number = Math.floor(timeElapsed / one.year);
      words = this.formatDate(number, timeLang.year);
      remainder = Math.floor((timeElapsed - number * one.year) / one.month);

      if (remainder) {
        words += "\u00a0" +  this.formatDate(remainder, timeLang.month);
      }
    }

    return words;
  }

  /**
   * @description As the subclass's implementation of the default
   * [Command#execute]{@link module:command~Command#execute} method required for
   * implementation by the <code>Command</code> superclass, this function
   * handles requests for information pertaining to a given Fandom account. The
   * method queries the [Users]{@link https://www.mediawiki.org/wiki/API:Users}
   * and [Usercontribs]{@link https://www.mediawiki.org/wiki/API:Usercontribs}
   * endpoints to retrieve information about the user's registration date,
   * gender, user group membership, editcount, and date of last edit, formatting
   * this information in a readable format complete with fuzzy dates before
   * posting the results in the relevant server channel.
   * <br />
   * <br />
   * The original incarnation of this method (and the greater command subclass
   * itself) was primarily based on the SWF wiki's old Freenode IRC bot Jules,
   * which would post a humorous comment about a queried user in the server
   * channel on invocation. However, this "about" functionality was eventually
   * replaced in favor of a more useful, more informative moderatorial tool that
   * could provide comprehensive information about a given user account,
   * including semi-private information that would be otherwise obfuscated due
   * to not being displayed on userpage mastheads and other publicly accessible
   * page elements.
   * @function
   * @override
   * @see [Command#execute]{@link module:command~Command#execute}
   * @param {Object} message - A new <code>Discord.Message</code> class instance
   * containing information pertaining to the most recent server message, its
   * author, and the channel in which it was posted, among other data.
   * @param {Array<string>} args - An array of <code>string</code>s constituting
   * the arguments that follow the initial command invocation. In the case of
   * verification requests, these arguments are the words that make up the
   * username as separated by spaces; for example, the username "Jabba the Hutt"
   * would be passed as <code>["Jabba", "the", "Hutt"]</code> as the
   * <code>args</code> argument.
   * @param {Function} logReply - A reference to the [Client#addReply]{@link
   * module:client~Client#addReply} method, bound to the <code>Client</code>
   * class instance. This ensures command subclasses are not directly
   * interfacing with the server channels, a responsibility under the exclusive
   * purview of the Client class and its respective methods alone.
   * @returns {Promise<void>}
   */
  // @ts-ignore
  async execute (message, args, logReply) {
    if (!args.length) {
      return logReply(message, this.lang.error.username);
    }

    // lang aliases
    const fragments = this.lang.success.fragments;
    const delimiters = this.lang.success.delimiters;

    // Other definitions/declarations
    const segments = [];
    const wikiUsername = args.join(" ").trim();

    // Get data from MediaWiki API
    const data = await this.getUserInfo(wikiUsername);

    // Handle server errors
    if (!data.query || data.error) {
      console.log(`[${data.error.code}] - ${data.error.info}`);
      return logReply(message, this.lang.error.server);
    }

    // Cache retrieved data
    const user = data.query.users[0];
    const contribs = data.query.usercontribs[0];

    // Validate/sanitize data for subsequent formatting and posting
    const usergroups = Array.isArray(user.groups) ? user.groups : [];
    const editcount = typeof user.editcount == "number" ? user.editcount : null;

    // Variables with fallback values
    const username = typeof user.name == "string"
      ? user.name : fragments.unknownName;
    const gender = (typeof user.gender == "string" && user.gender != "unknown")
      ? user.gender : fragments.unknownGender;

    // Boolean flags
    const isInvalid = user.hasOwnProperty("invalid");
    const isMissing = user.hasOwnProperty("missing");
    const isBlocked = user.hasOwnProperty("blockedby");
    const isAutoconfirmed = usergroups.indexOf("autoconfirmed") != -1;

    // Sanitize timestamps as Date instances
    const registration = user.hasOwnProperty("registration")
      ? new Date(user.registration) : null;
    const lastEdit = (contribs && contribs.hasOwnProperty("timestamp"))
      ? new Date(contribs.timestamp) : null;

    // Handle cases of nonexistent username for which no data exists
    if (!user || !user.userid || isInvalid || isMissing) {
      return logReply(message, this.lang.error.nonexistent);
    }

    // Get formatted English user group names
    const groups = usergroups.filter(usergroup => {
      // Return usergroup if not excluded and if custom name exists for group
      return ["*", "user", "autoconfirmed"].indexOf(usergroup) == -1 &&
        Object.keys(this.config.groups).indexOf(usergroup) != -1;
    }).map(group => {
      if (this.config.groups.hasOwnProperty(group)) {
        return this.config.groups[group];
      }
    });

    if (isBlocked) {
      groups.unshift(fragments.blocked.replace("$1", username));
    } else if (isAutoconfirmed) {
      groups.unshift(fragments.autoconfirmed.replace("$1", username));
    }

    switch (groups.length) {
      case 0:
        segments.push(fragments.default.replace("$1", username));
        break;
      case 1:
        segments.push(groups[0]);
        break;
      case 2:
        segments.push(`${groups[0]} ${delimiters.conjunction} ${groups[1]}`);
        break;
      default:
        segments.push(
          groups.slice(0, -1).join(`${delimiters.separator} `) +
          delimiters.separator + " " + delimiters.conjunction + " " +
          groups[groups.length - 1]
        );
    }

    // Apply gender ("male", "female", or "unknown gender")
    segments.push(gender);

    // Optional registration fuzzy date
    if (registration) {
      segments.push(
        fragments.registration.replace("$1", this.timeago(registration))
      );
    }

    // Optional editcount value
    if (editcount) {
      segments.push(fragments.edits.replace("$1", editcount));
    }

    // Optional date of last edit
    if (lastEdit) {
      segments.push(fragments.lastEdit.replace("$1", this.timeago(lastEdit)));
    }

    if (this.config.utility.debug) {
      console.log(segments);
    }

    const output = (lastEdit)
      ? segments.slice(0, -1).join(`${delimiters.separator} `) +
        delimiters.terminator + " " + segments[segments.length - 1] +
        delimiters.terminator
      : segments.join(`${delimiters.separator} `) + delimiters.terminator;

    logReply(message, output, false);
  }
}

module.exports = About;