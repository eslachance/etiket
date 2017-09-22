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

module.exports = commands;