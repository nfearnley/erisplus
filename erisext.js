const path = require("path");
const fs = require("fs");

const requireReload = require("require-reload")(require);
var caller = require("caller");

// Walk up the call chain until we end up outside this module
function getCallerPath() {
    var callerpath;
    var n = 1;
    while (!callerpath || callerpath === module.filename) {
        n++;
        callerpath = caller(n);
    }
    return path.dirname(callerpath);
}

function getExtPath(extname) {
    var callerpath = getCallerPath();
    var extpath = path.resolve(callerpath, extname);
    return extpath;
}

function setupExtension(bot, extname) {
    bot.extensions = bot.extensions || {};

    extpath = getExtPath(extname);

    if (bot.extensions[extpath]) {
        throw new Error(`Extension ${extpath} already loaded.`);
    }

    var extension = requireReload(extpath);

    extension.setup(bot);

    bot.extensions[extpath] = extension;

    return extension;
}

function teardownExtension(bot, extname) {
    bot.extensions = bot.extensions || {};

    extpath = getExtPath(extname);

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

            var extdirpath = getExtPath(extdir);

            var files = fs.readdirSync(extdirpath);
            files = files.filter(f => path.extname(f) === ".js");
            files = files.map(f => path.resolve(extdirpath, f));
            files.forEach(function(extpath) {
                setupExtension(bot, extpath);
            });

            return bot;
        }
    });

    return Eris;
}

module.exports = init;
