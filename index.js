const Discord = require("discord.js");
const client = new Discord.Client();

const Enmap = require("enmap");

const moment = require("moment");
require("moment-duration-format");

const { inspect } = require('util');

config = require("./config.json");
settings = new Enmap({name: "settings", persistent: true});
tags = new Enmap({name: "tags", persistent: true});
blacklist = new Enmap({name: "blacklist", persistent: true});

let cooldown = new Set();

client.on('message', async (message) => {
  if (message.author.bot) return;

  if(!settings.has("prefixes")) {
    settings.set("prefixes", ['+', '?']);
  }

  const prefixes = settings.get('prefixes');
  let prefix = false;
  for(const thisPrefix of prefixes) {
    if(message.content.startsWith(thisPrefix)) prefix = thisPrefix;
  }
  if(!prefix) return;

  if(blacklist.has(message.author.id)) return;

  if(cooldown.has(message.author.id)) {
    return;
  } else {
    cooldown.add(message.author.id);
    setTimeout( () => {
      cooldown.delete(message.author.id);
    }, 1000);
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(tags.has(command)) {
    return message.channel.send(tags.get(command));
  }

  if(command === 'tags') {
    return message.channel.send(`**\`List of Available Tags\`**\n\`\`\`${tags.keyArray().join(", ")}\`\`\``);
  }

  const level = permLevel(message);
  if(level === 0) return;

  if(command === 'tag') {
    if(args[0] === 'add') {
      if(level < 2) return message.reply("Insufficient level to add a new tag");
      const [ name, ...content ] = args.slice(1);
      if(tags.has(name)) return message.reply("That tag already exists");
      if(['eval', 'help', 'tag'].includes(name)) return message.reply("Cannot use reserved tag names.");
      tags.set(name, content.join(" "));
      return message.reply("Tag has been added!");
    } else if (args[0] === 'del') {
      if(level < 3) return message.reply("Insufficient level to delete tags");
      const name = args[1];
      if(!tags.has(name)) return message.reply("Tag name not found");
      tags.delete(name);
      return message.reply("Tag has been removed");
    } else if (args[0] === 'edit') {
      if(level < 2) return message.reply("Insufficient level to edit tags");
      const [ name, ...content ] = args;
      if(!tags.has(name)) return message.reply("Tag name not found");
      tags.set(name, contents.join(" "));
      return message.reply("Tag has been edited!");
    } else if (args[0] === 'rename') {
      if(level < 2) return message.reply("Insufficient level to edit tags");
      const [ oldName, newName ] = args.slice(1);
      if(!tags.has(oldName)) return message.reply("Tag name not found");
      const oldTag = tags.get(oldName);
      tags.set(newName, oldTag);
      tags.delete(oldName);
      return message.reply("Tag has been renamed.");
    }
  }

  if(command === 'blacklist') {
    if (level < 2) return message.reply("Insufficient level to edit the blacklist.");
    if (args[0] === 'add') {
      const user = message.mentions.users.first() || client.users.get(args[1]);
      if(!user) return message.reply("Cannot resolve mention or ID to a user.");
      if(blacklist.has(user.id)) return message.reply("User's already blacklisted. Whew, Double Blacklist! Harsh.");
      blacklist.set(user.id, message.createdTimestamp);
      return message.reply("User has been blacklisted.");
    } else if (args[0] === 'remove') {
      const user = message.mentions.users.first() || client.users.get(args[1]);
      if(!user) return message.reply("Cannot resolve mention or ID to a user.");
      const blEntry = blacklist.get(user.id);
      if(!blEntry) return message.reply("User is not blacklisted.");
      const duration = moment.duration(moment.createdTimestamp - blEntry).format(" D [days], H [hrs], m [mins], s [secs]");
      blacklist.delete(user.id);
      message.reply(`User removed from the blacklist. Was blacklisted: ${duration}`);
    }
  }

  if(command === 'eval') {
    if (level < 4) return message.reply("Naaaaaah eval is reserved to the almighty Evie.Codes");
    if (message.author.id !== config.ownerID) {
      return message.reply("I don't know who you are or how you bypassed the first check but I have a very particular set of skills and I will find you and I will kill you.");
    }
    const code = args.join(" ");
    try {
      const evaled = clean(await eval(code));
      message.channel.send(`\`\`\`xl\n${evaled}\n\`\`\``);
    }
    catch(err) {
      message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
    return;
  }
});

client.login(config.token);

const permLevel = async (message) => {
  if(message.author.id === config.ownerID) return 4;
  if(message.member.roles.some(r=>['41771983423143936', '180036462832648192'].includes(r.id))) {
    return 3
  }
  if(message.member.roles.some(r=>['203287359125585920', '231560987508080650'].includes(r.id))) {
    return 2
  }
  if(blacklist.has(message.author.id)) return -1;
  return 0;
}


clean = (text) => {
  if (typeof text !== 'string')
    text = inspect(text, {depth: 0})
  text = text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203))
      .replace(client.token, "mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0");
  return text;
};