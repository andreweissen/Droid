// @ts-check
/**
 * @file The <code>verify</code> module serves to encapsulate the class of the
 * same name. The <code>Verify</code> class, arguably the most important class
 * after [Client]{@link module:client~Client}, handles the verification of users
 * seeking access to the server by interfacing with the MediaWiki and Fandom
 * APIs to determine if the user is a contributor to the wiki. The need for this
 * functionality was ultimately responsible for the application's creation in
 * the first place, and the class was among the first written and tested.
 * @module verify
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

// @ts-check
/**
 * @classdesc Arguably the most important command and the second most important
 * class in the bot application apart from [Client]{@link module:client~Client},
 * the <code>Verify</code> class handles verification requests issued by
 * potential server members in the verify channel. As all prospective members
 * are required to be contributing users on the wiki with edits to their
 * username, the class makes a number of calls to the MediaWiki and Fandom APIs
 * to ensure that 1) the claimed Fandom username posted by the potential member
 * as part of the verification request matches an extant and active Fandom
 * account and 2) the Discord username of the requesting member matches the
 * Discord handle listed in the Fandom account's userpage masthead. This method
 * serves to prevent spoofing or impersonation and limits the possibility of
 * server raids by ensuring that only legitimate contributors may join the
 * server.
 * @class
 * @augments Command
 */
class Verify extends Command {

  /**
   * @description One of the two query methods of the <code>Verify</code> class,
   * <code>getUserInfo</code> is used to return general-purpose data about the
   * Fandom account associated with the parameter username. The query returns
   * data related to the account's user rights groups and associated permissions
   * and information regarding the account's edit count and registration date.
   * @function
   * @see [About#getUserInfo]{@link module:about~About#getUserInfo}
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
        list: "users",
        usprop: "groups|editcount",
        ususers: username,
        format: "json"
      }
    }).json();
  }

  /**
   * @description One of the two query methods of the <code>Verify</code> class,
   * <code>getMastheadValue</code> is used to return the Discord handle shown
   * in the specified parameter user account's userpage masthead.
   * @function
   * @param {number|string} userid - The specific user ID of the Fandom account
   * in question, obtained from the earlier <code>getUserInfo</code> invocation.
   * @returns {Object} - Making use of the <code>got</code> module's
   * <code>Promise.json</code>, the method returns raw JSON data retrieved from
   * the MediaWiki API query rather than a resolved or rejected promise object.
   */
  getMastheadValue (userid) {
    // @ts-ignore
    return got(path.join("https://services.fandom.com", "user-attribute",
        "user", String(userid), "attr", "discordHandle"), {
      headers: {
        accept: "*/*"
      }
    }).json();
  }

  /**
   * @description The <code>shouldBeChatModerator</code> helper method is used
   * to determine whether the user whose list of user groups are passed as a
   * parameter possesses the requisite user rights to merit the Chat Moderator
   * role on the Discord server. As a nod to Fandom's now-deprecated
   * <code>Special:Chat</code> extension from which the Chat Moderator user
   * right originated, only those on-wiki user groups who possessed moderator
   * rights on Special:Chat (namely, Administrator, Discussions Moderator, and
   * Chat Moderator) are provided the Chat Moderator role on the server.
   * @function
   * @param {Array<string>} groups - <code>Array</code> of <code>string</code>s
   * indicating which MediaWiki user rights the user in question possesses on
   * the wiki.
   * @returns {boolean} - A <code>boolean</code> value denoting whether the
   * user whose user groups were passed as the parameter possesses the rights
   * necessary to merit the Chat Moderator role on the Discord server.
   */
  shouldBeChatModerator (groups) {
    return new RegExp([
      "sysop",
      "chatmoderator",
      "threadmoderator"
    ].join("|")).test(groups.join(" "));
  }

  /**
   * @description As the subclass's implementation of the default
   * [Command#execute]{@link module:command~Command#execute} method required for
   * implementation by the <code>Command</code> superclass, this function
   * handles the verification process progression, assisted by a number of
   * helper functions used to query the Fandom and MediaWiki APIs for user info.
   * <br />
   * <br />
   * The method first checks to see if the message was logged in the verify
   * channel, determines if the user included a username with the command
   * invocation, and sees if the user already has the "User" role, logging an
   * appropriate message in the channel if any of these conditions are found to
   * be true.
   * <br />
   * <br />
   * Otherwise, the method then queries the MediaWiki API to retrieve relevant
   * account information about the given username, such as the number of edits,
   * registration date, user group memberships, etc. Server errors are handled
   * with appropriate messages, but if the query was successful and returned
   * wellformed data, the method checks next to see if the user account
   * specified exists, logging a warning if it doesn't. If the account does
   * exists but lacks edits, the method will again warn and exit.
   * <br />
   * <br />
   * Once the user account has been determined to exist, the method then queries
   * Fandom's service API to retrieve the value of the Discord handle displayed
   * on the userpage masthead, a field which may only be edited by the account
   * that owns the userpage. If no field value is found or if the masthead
   * value displays a different Discord handle than the one belonging to the
   * invoking Discord user, the method logs a message. However, if the handles
   * match, the method then proceeds into the role-granting portion of the
   * progression.
   * <br />
   * <br />
   * Now cleared to grant roles, the method checks to see if the user is in one
   * of the three user rights groups on the wiki that could previously moderate
   * the pre-UCP Special:Chat extension on the wiki (this is the default,
   * adjustable via the config file). If so, the method grants the Chat
   * Moderator role. Otherwise, it simply grants the standard user role, logs a
   * new message in the directory channel to help mitigate username confusion,
   * then informs the user that the appropriate roles have been granted before
   * exiting.
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
    let userInfo, verifyUser, wikiUsername, user;

    // Only permit verify commands in the verify channel
    if (message.channel.id !== this.config.channels.verify) {
      return logReply(message, this.lang.error.misplaced);
    }

    // Return if no username is specified by verifing user
    if (!args.length) {
      return logReply(message, this.lang.error.username);
    }

    // Check if user already has the proper role
    if (message.member.roles.cache.has(this.config.roles.user)) {
      return logReply(message, this.lang.error.redundant);
    }

    // Format username and query MW API for details
    wikiUsername = args.join(" ").trim();

    try {
      userInfo = await this.getUserInfo(wikiUsername);
    } catch (e) {
      userInfo = {error: e};
    }

    // Handle server errors
    if (userInfo.error) {
      console.log(`[${userInfo.error.code}] - ${userInfo.error.info}`);
      return logReply(message, this.lang.error.server);
    }

    user = userInfo.query.users[0];

    // Handle cases of nonexistent username for which no data exists
    if (!user || !user.userid) {
      return logReply(message, this.lang.error.nonexistent);
    }

    // Only users with edits on the wiki may join the server
    if (user.editcount === 0) {
      return logReply(message, this.lang.error.edits);
    }

    // Handle edge case of users who never provided initial handle values
    try {
      verifyUser = await this.getMastheadValue(user.userid);
    } catch (e) {
      verifyUser = {};
    }

    // Handle missing masthead Discord handle values
    if (!verifyUser.hasOwnProperty("value") || !verifyUser.value.length) {
      return logReply(message, this.lang.error.missing);
    }

    // Handle cases of verifying user's handle not matching masthead value
    if (verifyUser.value !== message.author.tag) {
      return logReply(message, this.lang.error.mismatched);
    }

    // Give Chat Moderator right to administrative team members
    if (this.shouldBeChatModerator(user.groups)) {
      message.member.roles.add(this.config.roles.moderator);
    }

    // Provide the default user role and access to the server
    message.member.roles.add(this.config.roles.user);

    // Log the new member's Discord handle with the Fandom username
    message.client.channels.cache.get(this.config.channels.directory).send(
      `${message.author.tag} -> User:${wikiUsername}`
    );

    // Notify the user and remove all verification messages
    logReply(message, this.lang.success.granted);
  }
}

module.exports = Verify;