/* eslint consistent-return: 0 */
const Discord = require('discord.js');
const client = new Discord.Client();

const Enmap = require('enmap');

const moment = require('moment');
require('moment-duration-format');

const { inspect } = require('util');

const config = require('./config.js');
const settings = new Enmap({ name: 'settings', persistent: true });
const tags = new Enmap({ name: 'tags', persistent: true });
const blacklist = new Enmap({ name: 'blacklist', persistent: true });

const cooldown = new Set();

const validateThrottle = (message, level) => {
  if (blacklist.has(message.author.id)) {
    return [false, 'blacklisted'];
  }

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

const commands = {
  tags: {
    run: () => [`**\`List of Available Tags\`**\n\`\`\`${tags.keyArray().map(key => `+${key}`).join(' ')}\`\`\``, null],
    level: 0
  },
  list: {
    run: () => commands.tags.run(),
    level: () => commands.tags.level
  },
  tag: {
    run: (message, args) => {
      const [action, name, ...content] = args;
      let answer;
      switch (action) {
        case 'add':
          if (tags.has(name)) return message.channel.send('That tag already exists');
          if (['eval', 'help', 'tag', 'list'].includes(name)) return message.reply('Cannot use reserved tag names.');
          tags.set(name, content.join(' '));
          answer = [null, '☑'];
          break;
        case 'del':
          if (tags.has(name)) {
            tags.delete(name);
            answer = [null, '☑'];
          } else {
            answer = ['Tag name not found', null];
          }
          break;
        case 'edit':
          if (tags.has(name)) {
            tags.set(name, content.join(' '));
            answer = [null, '☑'];
          } else {
            answer = ['Tag name not found', null];
          }
          break;
        case 'rename':
          if (tags.has(name)) {
            const newName = content[0];
            const oldTag = tags.get(name);
            tags.set(newName, oldTag);
            tags.delete(name);
            answer = [null, '☑'];
          } else {
            answer = ['Tag name not found', null];
          }
          break;
        default:
          answer = [null, '⁉'];
      }
      return answer;
    },
    level: 2
  },
  blacklist: {
    run: (message, args) => {
      const action = args[0];
      let user = args[1];
      user = client.users.get(args[1]) || message.mentions.users.first();
      if (!user) return ['Cannot resolve mention or ID to a user.', null];
      let answer;
      switch (action) {
        case 'add':
          blacklist.set(user.id, message.createdTimestamp);
          try {
            message.guild.channels.find('name', 'mod-log')
              .send(`🚷 ${user.tag} (\`${user.id}\`) added to blacklist by ${message.author.tag} (\`${message.author.id}\`).`);
          } catch (err) {
            /* do nothing */
          }
          answer = [null, '☑'];
          break;
        case 'remove':
        case 'del':
          if (blacklist.has(user.id)) {
            const blEntry = blacklist.get(user.id);
            const duration = moment.duration(moment.createdTimestamp - blEntry).format(' D [days], H [hrs], m [mins], s [secs]');
            blacklist.delete(user.id);
            try {
              message.guild.channels.find('name', 'mod-log')
                .send(`☑ ${user.tag} (\`${user.id}\`) removed from the blacklist by ${message.author.tag} (\`${message.author.id}\`). Was blacklisted: ${duration}`);
            } catch (err) {
              /* do nothing */
            }
            answer = [null, '☑'];
          } else {
            answer = ['User not in blacklist.', null];
          }
          break;
        default:
          answer = [null, '⁉'];
      }
      return answer;
    },
    level: 2
  },
  eval: {
    run: async (message, args) => {
      const code = args.join(' ');
      try {
        const evaled = clean(await eval(code));
        return [`\`\`\`xl\n${evaled}\n\`\`\``, null];
      } catch (err) {
        return [`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``, null];
      }
    },
    level: 4
  },
  reboot: {
    run: () => process.exit(1),
    level: 3
  }
};

async function handleMessage(message) {
  if (message.author.bot) return;

  const prefix = getPrefix(message);
  if (!prefix) return;

  if (message.guild && !message.member) await message.guild.fetchMember(message.author);
  const level = permLevel(message);

  const [valid, status] = validateThrottle(message, level);
  if (!valid) {
    switch (status) {
      case 'blacklisted':
        return message.react('🚫');
      case 'throttled':
        return message.react('⏱');
    }
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (tags.has(command)) {  
    return message.channel.send(tags.get(command));
  }

  if (commands[command]) {
    const thisCommand = commands[command];
    if (level < thisCommand.level) {
      return message.react('🚫');
    } else {
      const [answer, reaction] = thisCommand.run(message, args);
      if (answer) message.channel.send(answer);
      if (reaction) message.react(reaction);
    }
  }
}

client.on('ready', () => {
  console.log('Ready to serve');
  client.user.setGame(`?tags | Serving DDevs since 2017`);
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
