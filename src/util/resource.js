/**
 * @file The <code>resource</code> module serves to encapsulate the class of the
 * same name. The <code>Resource</code> class is used to serve the most updated
 * version of the requested resource, checking for any custom user-defined
 * resources in the home directory and reconciling their values with those of
 * the default resource stored in <code>./src/resources</code> before returning
 * the assembled result as an <code>Object</code>.
 * @module resource
 * @author Andrew Eissen <andrew@andreweissen.com>
 */
"use strict";

/**
 * @classdesc The <code>Resource</code> class serves as a middleman that handles
 * all requests for JSON data stored in <code>./src/resources</code>, the
 * contents of which directory constitute language data representing the text of
 * messages logged by the application in the server and various configuration
 * data coordinating the manner in which the application is run from the user's
 * perspective.
 * <br />
 * <br />
 * All of these resources are technically user-configurable, meaning that an
 * implementing user may include custom <code>config.json</code> and
 * <code>lang.json</code> files in the root directory if the defaults stored in
 * <code>./src/resources</code> are not sufficient. This class is responsible
 * for checking if such custom files exist, and if they do, reconciling their
 * contents with the default resource values before returning a new
 * <code>Object</code> that reflects the desired changes.
 * <br />
 * <br />
 * The main means by which this is mediated is a [pure JS implementation]{@link
 * module:resource~Resource#extend} of the deep merge/copy functionality
 * provided by default in the jQuery library by [$.extend]{@link
 * https://api.jquery.com/jquery.extend/}. The default JSON <code>Object</code>
 * of the desired resource is copied and its contents updated with values
 * obtained from the user-input file in the home directory, allowing for the
 * installing user to not have to copy/paste the entire contents of the desired
 * default resource into a custom file just to make a few minor changes.
 * @class
 */
class Resource {

  /**
   * @description The <code>Resource</code> constructor handles the sanitation
   * of the input parameter <code>file</code> to ensure it is a properly
   * suffixed JSON file, checks whether the optional custom resource file stored
   * in the home directory by the implementing user exists, and chooses whether
   * to invoke <code>Resource#extend</code> and reconcile user input with
   * default values or simply return the standard default resource file on its
   * own.
   * @constructor
   * @param {string|String} file - A <code>string</code> representation of the
   * requested file resource; this should a properly suffixed JSON file name.
   * @returns {Object}
   */
  constructor (file) {
    if (!file.endsWith(".json")) {
      file += ".json";
    }

    // Get default JSON file from ./src/resources
    this.defaults = require(`../resources/${file}`);

    // Check if custom file exists in home directory
    try {
      this.custom = require(`../../${file}`);
    } catch (error) {
      return this.defaults;
    }

    return this.extend(this.defaults, this.custom);
  }

  /**
   * @description The <code>Resource#extend</code> method is a handwritten
   * implementation of [$.extend]{@link https://api.jquery.com/jquery.extend/},
   * one of the more useful default jQuery methods. Unlike that function,
   * however, this implementation only performs recursive deep merging, not the
   * shallow merge/copy made more readily available ES6+ via default methods
   * like <code>Object.assign</code>. This function is used to construct a new
   * resource <code>Object</code> that takes the values of the default resource
   * JSON file and updates extant keys' values with those taken from the user
   * input JSON file stored in the home directory. This allows for implementing
   * users to choose only to override certain fields in a custom JSON file
   * rather than having to copy/paste the whole default file just to make a few
   * adjustments.
   * @function
   * @see [$.extend]{@link https://api.jquery.com/jquery.extend/}
   * @returns {Object} - Ultimately, an updated resource <code>Object</code>
   * that contains reconciled default values and user input values.
   */
  extend () {
    let i, j, keys, value, clone;

    // Like $.extend, this supports > 2 parameter objects
    for (i = 0, clone = {}; i < arguments.length; i++) {
      keys = Object.keys(arguments[i]);
      for (j = 0; j < keys.length; j++) {
        value = arguments[i][keys[j]];
        clone[keys[j]] = this.isObject.call(this, value)
          ? this.extend.call(this, clone[keys[j]] || {}, value)
          : value;
      }
    }

    return clone;
  }

  /**
   * @description This helper function is used by <code>Resource#extend</code>
   * to determine if subsequent recursive invocations of the method are required
   * in the event of a nested <code>Object</code> being encountered. The method
   * simply checks if the input parameter <code>value</code> is actually an
   * <code>Object</code>, returning a <code>boolean</code> to this effect.
   * @function
   * @param {*} value - The value to be checked to determine if its type is
   * <code>Object</code>.
   * @returns {boolean} - A status <code>boolean</code> indicating whether the
   * input parameter <code>value</code> is of type <code>Object</code>.
   */
  isObject (value) {
    return value && typeof value === "object" && value.constructor === Object &&
      Object.prototype.toString.call(value) === "[object Object]";
  }
}

module.exports = Resource;