/* eslint consistent-return: 0 */
const moment = require('moment');
require('moment-duration-format');
const { inspect } = require('util');

const config = require('./config.js');
const Discord = require('discord.js');
const client = new Discord.Client({
  disableEveryone: true,
  disabledEvents: config.disabledEvents,
  messageCacheMaxSize: 10,
  messageCacheLifetime: 10
});

const Provider = require('enmap-mongo');
const Enmap = require('enmap');
const { settings, tags, blacklist, langs } = Enmap.multi(['settings', 'tags', 'blacklist', 'langs'], Provider, { url: config.mongodb.url });

const cooldown = new Set();

const commands = {
  tags: {
    run: async (message) => {
      const list = message.strings.taglist.replace('{tags}', tags.keyArray().map(key => `+${key}`).join(' '));
      try {
        return [await message.author.send(list), null];
      } catch (err) {
        return [message.strings.enabledms, '❌'];
      }
    },
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
          if (tags.has(name)) return message.channel.send(message.strings.tagexists);
          if (['eval', 'tag', 'list'].includes(name)) return message.reply(message.strings.reservedtagname);
          tags.set(name, content.join(' '));
          answer = [null, '☑'];
          break;
        case 'del':
          if (tags.has(name)) {
            tags.delete(name);
            answer = [null, '☑'];
          } else {
            answer = [message.strings.tagnotfound, null];
          }
          break;
        case 'edit':
          if (tags.has(name)) {
            tags.set(name, content.join(' '));
            answer = [null, '☑'];
          } else {
            answer = [message.strings.tagnotfound, null];
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
            answer = [message.strings.tagnotfound, null];
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
      if (!user) return [message.strings.cantfinduser, null];
      let answer;
      switch (action) {
        case 'add':
          blacklist.set(user.id, message.createdTimestamp);
          message.guild.channels.find('name', 'mod-log')
            .send(message.strings.addedtoblacklist
              .replace('{user.tag}', user.tag)
              .replace('{user.id}', user.id)
              .replace('{author.tag}', message.author.tag)
              .replace('{author.id}', message.author.id))
            .catch();
          answer = [null, '☑'];
          break;
        case 'remove':
        case 'del':
          if (blacklist.has(user.id)) {
            const blEntry = blacklist.get(user.id);
            const duration = moment.duration(moment.createdTimestamp - blEntry).format(' D [days], H [hrs], m [mins], s [secs]');
            blacklist.delete(user.id);
            message.guild.channels.find('name', 'mod-log')
              .send(message.strings.addedtoblacklist
                .replace('{user.tag}', user.tag)
                .replace('{user.id}', user.id)
                .replace('{author.tag}', message.author.tag)
                .replace('{author.id}', message.author.id)
                .replace('{duration}', duration))
              .catch();
            answer = [null, '☑'];
          } else {
            answer = [message.strings.usernotinblacklist, null];
          }
          break;
        default:
          answer = [null, '⁉'];
      }
      return answer;
    },
    level: 2
  },
  settings: {
    run: async (message, args) => {
      let answer;
      if (!message.guild.id) {
        return ['Uhhhh how are you seeing this?', null];
      }
      const [action, key, ...val] = args;
      console.log(action, key, val);
      switch (action) {
        case 'set': case 'edit':
          if (!message.settings[key]) {
            return [message.strings.invalidsetting, null];
          }
          if (message.settings[key].constructor.name.toLowerCase() === 'array') {
            return [message.strings.settingisarray, null];
          }
          message.settings[key] = val.join(' ');
          settings.set(message.guild.id, message.settings);
          answer = [null, '☑'];
          break;
        case 'reset':
          if (!message.settings[key]) {
            return [message.strings.invalidsetting, null];
          }
          delete message.settings[key];
          settings.set(message.guild.id, message.settings);
          answer = [null, '☑'];
          break;
        case 'add': case 'append':
          if (!message.settings[key]) {
            return [message.strings.invalidsetting, null];
          }
          if (!message.settings[key].constructor.name.toLowerCase() === 'array') {
            return [message.strings.settingnotarray, null];
          }
          if (message.settings[key].indexOf(val.join(' ')) > -1) {
            return ['This value is already in the settings array.', null];
          }
          message.settings[key].push(val.join(' '));
          settings.set(message.guild.id, message.settings);
          answer = [null, '☑'];
          break;
        case 'del': case 'remove':
          if (!message.settings[key]) {
            return [message.strings.invalidsetting, null];
          }
          if (!message.settings[key].constructor.name.toLowerCase() === 'array') {
            return [message.strings.settingnotarray, null];
          }
          if (message.settings[key].indexOf(val.join(' ')) < 0) {
            return [message.strings.cantfindinarray, null];
          }
          message.settings[key].slice(message.settings[key].indexOf(val.join(' ')), 1);
          settings.set(message.guild.id, message.settings);
          answer = [null, '☑'];
          break;
        case 'list': case 'view': default:
          answer = [JSON.stringify(message.settings), null];
          break;
      }
      return answer;
    },
    level: 3
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

module.exports = commands;

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

const getPrefix = (message) => message.settings.prefixes.find((prefix) => message.content.startsWith(prefix));

const getSettings = (message) => {
  const def = config.defaultSettings;
  if (!message.guild) return def;
  const overrides = settings.get(message.guild.id) || {};
  for (const key in def) {
    overrides[key] = overrides[key] || def[key];
  }
  return overrides;
};

async function handleMessage(message) {
  if (message.author.bot) return;
  message.settings = getSettings(message);

  const prefix = getPrefix(message);
  if (!prefix) return;

  if (message.guild && !message.member) await message.guild.members.fetch(message.author);
  const level = permLevel(message);

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  message.strings = langs.get(message.settings.lang);

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
  client.user.setActivity(`?tags`);
  client.guilds.forEach(guild => {
    if (!settings.has(guild.id)) settings.set(guild.id, settings.defaultConfig);
  });
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

// process.on('unhandledRejection', console.dir);
