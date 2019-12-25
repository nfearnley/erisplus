# Eris+

Additional features for the [Eris](https://abal.moe/Eris) NodeJS Discord library

## Convenience properties

* Message.guild - The guild this message was sent to (if sent to a guild)
* Message.bot - The Eris Client instance
* Member.name - The member's nickname, or username if no nickname is set
* User.name - The user's username

## Easier message methods

* Message.reply(content, timeout) - Reply to the message
* Message.deleteIn(timeout) - Delete a message after a timeout

## Support for Client extensions

* Client.loadExtension(extname) - Load an extension
* Client.reloadExtension(extname) - Reload an extension
* Client.unloadExtension(extname) - Unload an extension
* Client.loadExtensions(extdir) - Load all extensions in a directory
