// @ts-check
/**
 * @file The <code>index.js</code> file contains the the coordinating
 * application logic responsible for the initialization process required to
 * start the application. The code contained within first acquires all the
 * needed modules, loads all required resources via the [Resource]{@link
 * module:resource~Resource} class, then initializes a new [Client]{@link
 * module:client~Client} class instance and provides it the Discord bot
 * token/application ID and the requisite resources. The available commands are
 * then loaded via a [loadCommandDir]{@link module:client~Client#loadCommandDir}
 * invocation before the application is brought online via a [login]{@link
 * module:client~Client#login} call.
 * @author Andrew Eissen <andrew@andreweissen.com>
 * @requires path
 * @requires dotnev
 * @requires resource
 * @requires client
 * @requires config
 * @requires lang
 */
"use strict";

/** @const {Object} path - Path module */
const path = require("path");

/** @const {Object} dotenv - dotenv module */
const dotenv = require("dotenv");

/** @const {Object} Resource - Resource module, returns class */
const Resource = require(path.join(__dirname, "src", "resources", "util",
  "resource.js"));

/** @const {Object} Client - Client module, returns class */
const Client = require(path.join(__dirname, "src", "client.js"));

/** @const {Object} config - Config JSON object */
const config = new Resource("config.json");

/** @const {Object} lang - Local language JSON object */
const lang = new Resource("lang.json");

// Convert .env file contents to properties of process.env object
dotenv.config();

/** @const {Client} client - New <code>Client</code> instance */
const client = new Client(process.env.TOKEN, config, lang);

// Populate Client instance's Map with all command subclasses
client.loadCommandDir(path.join(__dirname, "src", "commands", "lib"));

// Create and open websocket via Discord.Client#login
client.login(process.env.TOKEN);