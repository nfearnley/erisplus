const path = require("path");
const fs = require("fs");

const requireReload = require("require-reload")(require);
var caller = require("caller");

/**
 * Tried to unload or reload an extension that isn't loaded
 */
class ExtensionError extends Error {
    constructor(message) {
        super(message);
        this.name = "ExtensionError";
    }
}

/**
 * Tried to unload or reload an extension that isn't loaded
 */
class ExtensionNotLoadedError extends ExtensionError {
    constructor(message) {
        super(message);
        this.name = "ExtensionNotLoadedError";
        this.code = "EXTENSION_NOT_LOADED";
    }
}

/**
 * Tried to load an extension that is already loaded
 */
class ExtensionAlreadyLoadedError extends ExtensionError {
    constructor(message) {
        super(message);
        this.name = "ExtensionAlreadyLoadedError";
        this.code = "EXTENSION_ALREADY_LOADED";
    }
}

/**
 * Tried to load or reload an extension that doesn't exist
 */
class ExtensionNotFoundError extends ExtensionError {
    constructor(message) {
        super(message);
        this.name = "ExtensionNotFoundError";
        this.code = "EXTENSION_NOT_FOUND";
    }
}

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
    extpath = path.join(path.dirname(extpath), path.basename(extpath, ".js"));
    return extpath;
}

function setupExtension(bot, extname) {
    bot.extensions = bot.extensions || {};

    extpath = getExtPath(extname);

    if (bot.extensions[extpath]) {
        throw new ExtensionAlreadyLoadedError(`Extension ${extpath} already loaded.`);
    }

    try {
        var extension = requireReload(extpath);
    }
    catch (err) {
        if (err.code === "MODULE_NOT_FOUND") {
            throw new ExtensionNotFoundError(`Extension ${extpath} not found.`);
        }
        throw err;
    }

    extension.setup(bot);

    bot.extensions[extpath] = extension;

    return extension;
}

function teardownExtension(bot, extname) {
    bot.extensions = bot.extensions || {};

    extpath = getExtPath(extname);

    if (!bot.extensions[extpath]) {
        throw new ExtensionNotLoadedError(`Extension ${extpath} not yet loaded.`);
    }

    bot.extensions[extpath].teardown(bot);

    delete bot.extensions[extpath];
}


/**
 * Load an extension
 *
 * @memberOf external:Client#
 * @method loadExtension
 * @arg {string} extname
 */
function loadExtension(extname) {
    var bot = this;
    setupExtension(bot, extname);
    return bot;
}

/**
 * Reload an extension
 *
 * @memberOf external:Client#
 * @method reloadExtension
 * @arg {string} extname
 */
function reloadExtension(extname) {
    var bot = this;
    teardownExtension(bot, extname);
    setupExtension(bot, extname);
    return bot;
}

/**
 * Unload an extension
 *
 * @memberOf external:Client#
 * @method unloadExtension
 * @parameter {string} extname
 */
function unloadExtension(extname) {
    var bot = this;
    teardownExtension(bot, extname);
    return bot;
}

/**
 * Load all extensions in a directory
 *
 * @memberOf external:Client#
 * @method unloadExtension
 * @arg {string} extdir
 */
function loadExtensions(extdir) {
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

function init(Eris) {
    Eris.ExtensionNotLoadedError = ExtensionNotLoadedError;
    Eris.ExtensionAlreadyLoadedError = ExtensionAlreadyLoadedError;
    Eris.ExtensionNotFoundError = ExtensionNotFoundError;

    Object.defineProperty(Eris.Client.prototype, "loadExtension", {
        value: loadExtension
    });

    Object.defineProperty(Eris.Client.prototype, "reloadExtension", {
        value: reloadExtension
    });

    Object.defineProperty(Eris.Client.prototype, "unloadExtension", {
        value: unloadExtension
    });

    Object.defineProperty(Eris.Client.prototype, "loadExtensions", {
        value: loadExtensions
    });

    return Eris;
}

module.exports = init;
