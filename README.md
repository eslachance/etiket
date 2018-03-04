# Etiket - Dead Simple Tags

Etiket is a simple tag bot that offers very few features execpt for its main one: **Tags**. 

What are *Tags* you ask? They're bits of text that you repeat often and want to save somewhere so that you - or anyone else on your server - can call up at any time to answer frequently asked questions. 

Tags can be used to provide information, contact, instructions, or on the other hand can be filled with memes and jokes and all the shitposting you want. It's up to you to determine how tags are used!

## Prerequisites

> Don't want to bother installing this yourself and just want to use the bot yourself? Sure, just [invite it here](https://discordapp.com/api/oauth2/authorize?client_id=419529979768864770&permissions=2112&scope=bot)!

Etiket runs on node.js and uses the Discord.js library.  It uses a MongoDB database as a back-end.

It requires the following: 

- `git` command line ([Windows](https://git-scm.com/download/win)|[Linux](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)|[MacOS](https://git-scm.com/download/mac)) installed
- [Nodejs 7.6 or higher](http://nodejs.org/)
- `a machine` to host it on. Want it to be online 24/7? Get a VPS. I suggest [OVH](http://ovh.com/) (no there are no good free hosts).
- A MongoDB instance. If you do not have one, there are online free ones. For testing, check out [mLab](https://mlab.com/) which has a free sandbox option (not backed up).

## Installation

In a command prompt in your projects folder (wherever that may be) run the following:

`git clone https://github.com/eslachance/etiket.git`

Once finished: 

- In the folder from where you ran the git command, run `cd etiket` and then run `npm i`
- Rename `config.js.example` to `config.js`
- Edit `config.js` and enter your token and other details as indicated.

## First Start

To start etiket, in the command prompt, run the following command:
`node .`

> If at any point it says "cannot find module X" just run `npm install X` and try again.

## Commands Reference

The following commands are available in the bot (`<this>` is called a placeholder and you can replace it with actual data!): 

```
?tagname                            // Tags are accessed by prefix+tagname.

// Modifying tags is reserved for Moderator or higher.
?tag add <tagname> <Contents>       // Creates a new tag with the selected name. Can be multiple lines, markdown, etc. Currently does not support embeds and attachments
?tag rename <oldname> <newname>     // Rename existing tag
?tag edit <tagname>                 // Edit tag contents
?tag del <tagname>                  // Delete tag (cannot undo!)

// Blacklist are Moderator or higher only
?blacklist add <IDorUserMention>    // Prevents user from using bot completely
?blacklist remove <IDorUserMention> // Restores access to bot commands

// Settings are Admin/Guild owner only
?settings                           // View settings for the server
?settings edit <setting> <value>    // Edits the value of a setting for the server.
?settings reset <setting>           // Restores the global default for the settings key.
?settings add <setting> <value>     // For array settings, add a new value to the setting array (like prefixes)
?settings del <setting> <value>     // For array settings, remove the value from the settings array.

?eval <code>                        // Owner only, evals arbitrary javascript. useful for debugging/custom stuff

```

## Permanent run and Auto-restart

To run the bot permanently, you'll need `pm2`

For the first run: 

```
npm i -g pm2
pm2 start index.js --name="etiket"
```

- To start the bot after a system reboot, run `pm2 start etiket`
- To view the logs, just run `pm2 logs etiket`
- To restart the bot, run `pm2 restart etiket`
- To stop it, run `pm2 stop etiket`
- To setup auto start at boot, run `pm2 startup`, run the snip of text that it outputs, then run `pm2 save`.

## Support

If you need help running this bot, check the **Issues** pane on this repository. Support is not guaranteed, 