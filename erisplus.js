"use strict";

const path = require("path");
const fs = require("fs");

const log = require("loglevel");
const requireReload = require("require-reload")(require);
const Eris = require("eris");

const utils = require("./utils");

/**
 * @external Message
 */
/**
 * @external Member
 */
/**
 * @external User
 */
/**
 * @external Client
 */

/**
 * The guild this message was sent to (if sent to a guild)
 *
 * @memberOf external:Message#
 * @member guild
 */
Object.defineProperty(Eris.Message.prototype, "guild", {
    get: function() {
        return this.channel.guild;
    }
});

/**
 * The Eris Client instance
 *
 * @memberOf external:Message#
 * @member bot
 */
Object.defineProperty(Eris.Message.prototype, "bot", {
    get: function() {
        var m = this;
        return m._client;
    }
});

/**
 * Reply to the message
 * @memberOf external:Message#
 * @member reply
 * @arg {String | Array | Object} content A string, array of strings, or object. If an object is passed:
 * @arg {String} content.content A content string
 * @arg {Object} [content.embed] An embed object. See [the official Discord API documentation entry](https://discordapp.com/developers/docs/resources/channel#embed-object) for object structure
 * @arg {Boolean} [content.tts] Set the message TTS flag
 * @arg {Boolean} [content.disableEveryone] Whether to filter @everyone/@here or not (overrides default)
 * @arg {Number} [timeout] If provided, how long in milliseconds to display the message before deleting it
 * @returns {Promise<Message>}
 */
Object.defineProperty(Eris.Message.prototype, "reply", {
    value: async function(content, timeout) {
        var m = this;

        var sentMsg = m.bot.createMessage(m.channel.id, content);
        if (timeout) {
            sentMsg.then(m => m.deleteIn(timeout));
        }
        return sentMsg;
    }
});

/**
 * Delete a message after a timeout
 * @memberOf external:Message#
 * @member deleteIn
 * @arg {Number} [timeout] How long in milliseconds to wait before deleting the message
 */
Object.defineProperty(Eris.Message.prototype, "deleteIn", {
    value: async function(timeout) {
        var m = this;

        if (!timeout) {
            return m;
        }

        await utils.delay(timeout);
        try {
            await m.delete("Timeout");
        }
        catch (err) {
            log.error(err);
        }

        return m;
    }
});

/**
 * The member's nickname, or username if no nickname is set
 * @memberOf external:Member#
 * @member {String} name
 */
Object.defineProperty(Eris.Member.prototype, "name", {
    get: function() {
        var member = this;
        return member.nickname || member.username;
    }
});

/**
 * The user's username
 *
 * @memberOf external:User#
 * @member {String} name
 */
Object.defineProperty(Eris.User.prototype, "name", {
    get: function() {
        var user = this;
        return user.username;
    }
});

function resolveExt(name) {
    // Try to resolve the path to an actual module
    var abspath = null;
    try {
        abspath = require.resolve(name);
    }
    catch (err) {
        if (err.code !== "MODULE_NOT_FOUND") {
            throw err;
        }
    }

    var relpath;
    if (abspath) {
        relpath = path.relative(__dirname, abspath);
    }
    else {
        relpath = path.relative(__dirname, path.resolve(name));
    }

    let fileExt = path.extname(relpath);
    name = relpath.slice(0, -fileExt.length);

    return {
        name: name, // Normalized name of extension
        path: abspath // Path to module (null if module not found)
    };
}

function setupExtension(bot, extname) {
    bot.extensions = bot.extensions || {};

    var ext = resolveExt(extname);

    if (bot.extensions[ext.name]) {
        throw new Error(`Extension ${ext.name} already loaded.`);
    }

    if (ext.path) {
        throw new Error(`Extension ${ext.name} not found.`);
    }

    var extension = requireReload(ext.path);

    extension.setup(bot);

    bot.extensions[ext.name] = extension;

    return extension;
}

function teardownExtension(bot, extname) {
    bot.extensions = bot.extensions || {};

    var ext = resolveExt(extname);

    if (!bot.extensions[ext.name]) {
        throw new Error(`Extension ${ext.name} not yet loaded.`);
    }

    bot.extensions[ext.name].teardown(bot);

    delete bot.extensions[ext.name];
}

/**
 * Load an extension
 *
 * @memberOf external:Client#
 * @method loadExtension
 * @arg {string} extname
 */
Object.defineProperty(Eris.Client.prototype, "loadExtension", {
    value: function(extname) {
        var bot = this;

        setupExtension(bot, extname);

        return bot;
    }
});

/**
 * Reload an extension
 *
 * @memberOf external:Client#
 * @method reloadExtension
 * @arg {string} extname
 */
Object.defineProperty(Eris.Client.prototype, "reloadExtension", {
    value: function(extname) {
        var bot = this;

        teardownExtension(bot, extname);
        setupExtension(bot, extname);

        return bot;
    }
});

/**
 * Unload an extension
 *
 * @memberOf external:Client#
 * @method unloadExtension
 * @parameter {string} extname
 */
Object.defineProperty(Eris.Client.prototype, "unloadExtension", {
    value: function(extname) {
        var bot = this;

        teardownExtension(bot, extname);

        return bot;
    }
});

/**
 * Load all extensions in a directory
 *
 * @memberOf external:Client#
 * @method unloadExtension
 * @arg {string} extdir
 */
Object.defineProperty(Eris.Client.prototype, "loadExtensions", {
    value: function(extdir) {
        var bot = this;

        var extdirpath = path.join(__dirname, extdir);

        var files = fs.readdirSync(extdirpath);
        files = files.filter(f => path.extname(f) === ".js");
        files = files.map(f => path.join(extdirpath, f));
        files.foreach(function(file) {
            setupExtension(bot, file);
        });

        return bot;
    }
});

module.exports = Eris;
