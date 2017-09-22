/* eslint consistent-return: 0 */
const config = require('./config.js');
const Discord = require('discord.js');
const client = new Discord.Client({
  disableEveryone: true,
  disabledEvents: config.disabledEvents,
  messageCacheMaxSize: 2,
  messageCacheLifetime: 1
});

const Enmap = require('enmap');

const moment = require('moment');
require('moment-duration-format');

const { inspect } = require('util');

const settings = new Enmap({ name: 'settings', persistent: true });
const tags = new Enmap({ name: 'tags', persistent: true });
const blacklist = new Enmap({ name: 'blacklist', persistent: true });

const cooldown = new Set();

const commands = require('./commands');

const validateThrottle = (message, level, command) => {
  if (blacklist.has(message.author.id)) {
    return [false, 'blacklisted'];
  }

  if (!tags.has(command) && !commands[command]) return [false, 'notfound'];

  if (cooldown.has(message.author.id)) {
    return [false, 'throttled'];
  } else if (level < 2) {
    cooldown.add(message.author.id);
    setTimeout(() => {
      cooldown.delete(message.author.id);
    }, config.cooldown);
  }
  return [true, null];
};

const getPrefix = (message) => settings.get('prefixes').find((prefix) => message.content.startsWith(prefix));

async function handleMessage(message) {
  if (message.author.bot) return;

  const prefix = getPrefix(message);
  if (!prefix) return;

  if (message.guild && !message.member) await message.guild.fetchMember(message.author);
  const level = permLevel(message);

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  const [valid, status] = validateThrottle(message, level, command);
  if (!valid) {
    switch (status) {
      case 'blacklisted':
        return message.react('🚫');
      case 'throttled':
        if (message.guild) {
          return message.react('⏱');
        }
        break;
      case 'notfound':
        return message.react('⁉');
    }
  }

  if (tags.has(command)) {
    return message.channel.send(tags.get(command));
  }

  if (commands[command]) {
    const thisCommand = commands[command];
    if (level < thisCommand.level) {
      return message.react('🚫');
    } else {
      const [answer, reaction] = await thisCommand.run(message, args);
      if (answer) message.channel.send(answer);
      if (reaction) message.react(reaction);
    }
  }
}

client.on('ready', () => {
  console.log('Ready to serve');
  client.user.setActivity(`?tags | Serving DDevs since 2017`);
});
client.on('message', handleMessage);

client.login(config.token);

const permLevel = (message) => {
  let permlvl = 0;

  const permOrder = config.permLevels.slice(0).sort((prev, curr) => prev.level < curr.level ? 1 : -1);

  while (permOrder.length) {
    const currentLevel = permOrder.shift();
    if (!message.guild && currentLevel.guildOnly) continue;
    if (currentLevel.check(message)) {
      permlvl = currentLevel.level;
      break;
    }
  }
  return permlvl;
};

const clean = (text) => {
  if (typeof text !== 'string') {
    text = inspect(text, { depth: 0 });
  }
  text = text
    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
    .replace(/@/g, `@${String.fromCharCode(8203)}`)
    .replace(client.token, 'mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0');
  return text;
};


  // These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
process.on('uncaughtException', (err) => {
  const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');
  console.error('Uncaught Exception: ', errorMsg);
  // process.exit(1);
});

process.on('unhandledRejection', err => {
  console.error('Uncaught Promise Error: ', err);
});
