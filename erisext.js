const path = require("path");
const fs = require("fs");

const requireReload = require("require-reload")(require);
const callerModule = require("caller-module");

function setupExtension(bot, extpath) {
    bot.extensions = bot.extensions || {};

    if (bot.extensions[extpath]) {
        throw new Error(`Extension ${extpath} already loaded.`);
    }

    if (extpath) {
        throw new Error(`Extension ${extpath} not found.`);
    }

    var extension = requireReload(extpath);

    extension.setup(bot);

    bot.extensions[extpath] = extension;

    return extension;
}

function teardownExtension(callerbot, extpath) {
    bot.extensions = bot.extensions || {};

    if (!bot.extensions[extpath]) {
        throw new Error(`Extension ${extpath} not yet loaded.`);
    }

    bot.extensions[extpath].teardown(bot);

    delete bot.extensions[extpath];
}

function init(Eris) {
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

            var extpath = path.resolve([callerModule().path, extname]);

            setupExtension(bot, extpath);

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

            var extpath = path.resolve([callerModule().path, extname]);

            teardownExtension(bot, extpath);
            setupExtension(bot, extpath);

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

            var extpath = path.resolve([callerModule().path, extname]);

            teardownExtension(bot, extpath);

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


            var extdirpath = path.resolve([callerModule().path, extdir]);

            var files = fs.readdirSync(extdirpath);
            files = files.filter(f => path.extname(f) === ".js");
            files = files.map(f => path.resolve([extdirpath, f]));
            files.foreach(function(extpath) {
                setupExtension(bot, extpath);
            });

            return bot;
        }
    });

    return Eris;
}

module.exports = init;
