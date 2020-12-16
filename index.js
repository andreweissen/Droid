// @ts-check
/**
 * @file index.js
 * @author Andrew Eissen <andrew@andreweissen.com>
 * @requires path
 * @requires dotnev
 * @requires client
 * @requires config
 * @requires lang
 */
"use strict";

/** @const {Object} path - Path module */
const path = require("path");

/** @const {Object} dotenv - dotenv module */
const dotenv = require("dotenv");

/** @const {Object} Client - Client module, returns class */
const Client = require(path.join(__dirname, "src", "client.js"));

/** @const {Object} config - Config JSON object */
const config = require(path.join(__dirname, "src", "resources", "config.json"));

/** @const {Object} lang - Local language JSON object */
const lang = require(path.join(__dirname, "src", "resources", "lang.json"));

// Convert .env file contents to properties of process.env object
dotenv.config();

/** @const {Client} client - New <code>Client</code> instance */
const client = new Client(process.env.TOKEN, config, lang);

// Populate Client instance's Map with all command subclasses
client.loadCommandDir(path.join(__dirname, "src", "commands", "lib"));

// Create and open websocket via Discord.Client#login
client.login(process.env.TOKEN);