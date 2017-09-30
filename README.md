# Etiket - Dead Simple Tags

Etiket is a very simple tag bot that offers pretty much no customizatin and no features except for one, which it does very well: It does **Tags**. 

What are *Tags* you ask? They're bits of text that you repeat often and want to save somewhere so that you - or anyone else on your server - can call up at any time to answer frequently asked questions. 

Tags can be used to provide information, contact, instructions, or on the other hand can be filled with memes and jokes and all the shitposting you want. It's up to you to determine how tags are used!

## Prerequisites

Etiket runs on node.js and uses the Discord.js library.

It requires the following: 

- `git` command line ([Windows](https://git-scm.com/download/win)|[Linux](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)|[MacOS](https://git-scm.com/download/mac)) installed
- [Nodejs 7.6 or higher](http://nodejs.org/)
- `a machine` to host it on. Want it to be online 24/7? Get a VPS. I suggest [OVH](http://ovh.com/) (no there are no good free hosts).
- C++ Build Tools (Windows: run `npm i -g --production windows-build-tools`. Unix: run `sudo apt-get install buildessentials` and figure out how to get python 2.7 on your system, good luck)
- Internet access

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
?tag add <tagname> <Contents>       // Creates a new tag with the selected name. Can be multiple lines, markdown, etc. Currently does not support embeds and attachments
?tag rename <oldname> <newname>     // Rename existing tag
?tag edit <tagname>                 // Edit tag contents
?tag del <tagname>                  // Delete tag (cannot undo!)

?tagname                            // Tags are accessed by prefix+tagname.

?blacklist add <IDorUserMention>    // Prevents user from using bot completely
?blacklist remove <IDorUserMention> // Restores access to bot commands

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

For support join [〈evie.codes〉](https://discord.gg/PhT8scR)
