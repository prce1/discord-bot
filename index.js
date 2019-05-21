/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

require('dotenv').config();

const fetch = require('node-fetch');
const Discord = require('discord.js');
const isString = require('lodash/isString');
const ytdl = require('ytdl-core');

const {
  debug,
  infoMessage,
  DAY_OF_WEEK,
  ALPHABETEMOJI,
} = require('./utils');

const botID = process.env.BOT_ID;
const botName = process.env.BOT_NAME;
const discordToken = process.env.CLIENT_TOKEN;
const groupName = process.env.DISCORD_GROUP_NAME;
const entryRole = `@${process.env.ENTRY_ROLE}`;

const client = new Discord.Client();

class StraightResponseError extends Error {}

client.on('ready', () => {
  debug(`${groupName} bot is up and running`);
  // client.channels.find('name', 'general')
  // .send(`${groupName} bot is up and running.`);
  // client.channels.find('name', 'general')
  // .send(`If you want a list of all commands, type "@${botName} help".`);
});

const HANDLERS = [[
  'error',
  (message) => {
    client.emit(
      'warn',
      new Error(`Error sent by a user: ${message.author.username}`
    ));
    client.emit('error', new Error('Error sent for testing purposes'));
    message.delete().catch(error => debug(error.message, 'error'));
    // message.channel.send('Y U DO DIS?');
  },
], [
  /^say:\s+(.+)/i,
  ((message, [_, msg]) => {
    message.channel.send(`${msg}\n@everyone`);
    message.delete().catch(error => debug(error.message, 'error'));
  }),
], [
  /^poll:\s*([^[]+)\s*$/i,
  ((message, [_, question]) => {
    message.channel.send(`${question}  @everyone`)
    .then(async (msg) => {
      await msg.react('👍');
      await msg.react('👎');
      await msg.react('🤷');
    });
    message.delete().catch(error => debug(error.message, 'error'));
  }),
], [
  /^poll:\s*([^[]+)\s+((\[[^\]]+\])+)\s*$/i,
  ((message, [_, rawQuestion, rawAnswers]) => {
    const answers = rawAnswers
    .slice(1, -1)
    .split('][')
    .map((answer, i) => `${ALPHABETEMOJI[i]} ${answer}`);
    message.channel.send(`${rawQuestion}  @everyone`);
    message.channel.send({
      embed: {
        color: 3447003,
        description: answers.join('\n\n'),
      },
    })
    .then(async (msg) => {
      for (let i = 0; i < answers.length; i++) {
        await msg.react(ALPHABETEMOJI[i]);
      }
    });
    message.delete().catch(error => debug(error.message, 'error'));
  }),
], [
  /^kick (.+)/i,
  ((message, [_, name]) => {
    const user = message.guild.members.get(name.replace(/[<@>]/g, ''));
    user
    .kick()
    .then(() => {
      const info = `${message.author.username} has successfully kicked ${
        user.user.username
      } from the server: ${groupName}`;
      debug(info);
      message.channel.send(info);
    })
    .catch(error => debug(error.message, 'error'));
  }),
], [
  /^ping$/i,
  message => message.channel.send('Got ping.'),
], [
  /^play (.+)$/i,
  async (message, [_, link]) => {
    if (message.member.voiceChannel) {
      const streamOptions = { seek: 0, volume: 1 };
      message.member.voiceChannel.join().then((connection) => {
        ytdl.getInfo(`${link}`).then((res) => {
          client.user.setActivity(`${res.title}`);
        });
        const stream = ytdl(`${link}`, { filter: 'audioonly' });
        const dispatcher = connection.playStream(stream, streamOptions);
        dispatcher.on('end', () => {
          message.member.voiceChannel.leave();
          client.user.setActivity();
        });
      }).catch(error => debug(error.message, 'error'));
    } else {
      message.reply('You need to join a channel first!');
    }
    message.delete(3000)

      // .then(msg => debug(`Deleted message from ${msg.author.username}`))

      .catch(error => debug(error.message, 'error'));
  },
], [
  'stop',
  (message) => {
    message.delete(3000)

      // .then(debug(`Deleted message from ${message.author.username}`))

      .catch(error => debug(error.message, 'error'));
    try {
      message.member.voiceChannel.leave();
    // eslint-disable-next-line no-empty
    } catch (error) {}
    client.user.setActivity();
  },
], [
  /^get me weather for ([^,]+)(?:, ([^\s]+))?/i,
  (message, [_, cityL, country = 'RS']) => {
    const city = cityL.split(' ').join('+');
    if (!process.env.GOOGLE_TOKEN || !process.env.DARKSKY_TOKEN) {
      message.channel.send('Your bot admin did not set up this feature.');
      return;
    }
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${city},+${
        country}&key=${process.env.GOOGLE_TOKEN}`
    )
    .then(res => res.json())
    .then((resJson) => {
      if (resJson.status === 'OVER_QUERY_LIMIT') {
        throw new StraightResponseError(
          'You have reached your Google API quota limit.'
        );
      }
      if (resJson.status !== 'OK') {
        throw new StraightResponseError('You have entered an invalid address.');
      } else {
        const { lat, lng } = resJson.results[0].geometry.location;
        const address = resJson.results[0].formatted_address;
        fetch(`https://api.darksky.net/forecast/${process.env.DARKSKY_TOKEN}/${
          lat
        }, ${lng}?units=si`)
        .then(result => result.json())
        .then((response) => {
          const current = response.currently;
          message.channel.send(
            `The current temperature in ${address} is **${
              current.temperature
            }°C**, and it feels like **${
              current.apparentTemperature
            }°C**.\nCurrent weather is **${
              current.summary.toLowerCase()
            }**, and the chance of rain is **${
              Math.round(current.precipProbability * 100)
            }%**.\nForecast for today is **${
              response.hourly.summary.toLowerCase()
            }**\nWeekly forecast: **${
              response.daily.summary
            }**`
          );
        });
      }
    })
    .catch((error) => {
      debug(error.message, 'error');
      if (error instanceof StraightResponseError) {
        message.channel.send(error.message);
      } else {
        message.channel.send(`Something went wrong: ${error.message}`);
      }
    });
  },
], [
  /^get me popularity of ([^\s]+)(?: on ([^\s]+))?(?: at (\d\d)h?)?/i,
  (
    message,
    [
      _,
      slug,
      dayInput = DAY_OF_WEEK[new Date().getDay()],
      timeInput = new Date().getMinutes() > 45
        ? (
            (new Date().getHours() + 1) === 24
            ? 0
            : (new Date().getHours() + 1)
          )
        : new Date().getHours(),
    ]
  ) => {
    fetch(`https://populr.app/api/places?query=${JSON.stringify({
      where: {
        'meta.name': {
          REGEX: slug,
          OPTIONS: 'i',
        },
      },
    })}`)
    .then(res => res.json())
    .then(({ data: [place] }) => {
      if (place) {
        const name = place.meta.name.charAt(0).toUpperCase() +
          place.meta.name.substr(1);
        const time = parseInt(timeInput, 10) === 24
          ? 0
          : parseInt(timeInput, 10);
        let day = DAY_OF_WEEK.indexOf(dayInput);
        if (day === -1) {
          day = DAY_OF_WEEK.indexOf(`${dayInput}s`);
          if (day === -1) {
            throw new StraightResponseError(`"${dayInput}" is not a day?!`);
          }
        } else if (time < 0 || time > 23) {
          throw new StraightResponseError(
            `Don't know what "${time}" is, but it's not a time of the day`
          );
        }
        const value = place.meta.popularity[(day * 24) + time];
        message.channel.send(`Popularity of ${name} on ${dayInput} at ${
          time}h is ${value}/100.\n${value < 20
          ? 'The place *isn\'t popular* at all at this time.'
          : value < 70
          ? 'The place has people, but it\'s not really full at this time.'
          : 'The place is *packed* at this time!'}`
        );
      } else {
        throw new StraightResponseError(
          `Cannot find place "${
            slug.charAt(0).toUpperCase() + slug.substr(1)
          }".`
        );
      }
    })
    .catch((error) => {
      debug(error.message, 'error');
      if (error instanceof StraightResponseError) {
        message.channel.send(error.message);
      } else {
        message.channel.send(`Oops, something went wrong: ${error.message}.`);
      }
    });
  },
], [
  /remind me to (.+) in (\d+)\s?([^\s]+)?/i,
  (message, [_, reminder, number, identifier = 'minutes']) => {
    let time = 0;
    identifier.toLowerCase();
    switch (identifier) {
      case 'seconds':
      time = parseInt(number, 10) * 1000;
      break;
      case 'minutes':
      time = parseInt(number, 10) * 60 * 1000;
      break;
      case 'hours':
      time = parseInt(number, 10) * 60 * 60 * 1000;
      break;
      case 'days':
      time = parseInt(number, 10) * 24 * 60 * 60 * 1000;
      break;
      default:
      message.channel.send(`Invalid time: ${number}`);
    }
    client.setTimeout(() => {
      debug(`Sent reminder: ${reminder}. to user: ${message.author}`);
      message.author.send(`You need to ${reminder}!`);
    }, time, message);
  },
], [
  'help',
  message => (
    message.author.send(infoMessage(botName))
    .then(message.delete())
  ),
]].map(([test, callback]) => ([
  isString(test)
  ? new RegExp(
      // eslint-disable-next-line no-useless-escape
      `^${test.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
      '\\$&')}$`,
      'i'
    )
  : test,
  callback,
]));

// eslint-disable-next-line consistent-return
client.on('message', (message) => {
  if ((/^(bot) ([^]+)$/).test(message.content)) {
    message.channel.send(`For a list of commands, type "@${botName} help".`);
  }
  if (message.mentions.users.find('id', botID)) {
    const messageReplaced = message.content
      .replace(new RegExp(`[,\\s]*<@${botID}>[,\\s]*`, 'g'), ' ')
      .trim();
    if (
      message.author.username !== `${botName}` &&
      message.content.trim().length > 0
    ) {
      for (let i = 0; i < HANDLERS.length; i++) {
        const [test, callback] = HANDLERS[i];
        const match = test.exec(messageReplaced);
        test.lastIndex = 0;
        if (match) {
          // message.delete(1000 * 15).catch(error => debug(error.message, 'error'));;
          return callback(message, match);
        }
        // message.channel.send(`For a list of commands, type "@${botName} help"`);
      }
    // } else if (message.author.username === `${botName}`) {
      //   message.delete(1000 * 3 * 60).catch(error => debug(error.message, 'error'));;
    }
  }
});

client.on('guildMemberAdd', (member) => {
  const guestRole = member.guild.roles.find(role => role.name === entryRole);
  const channel = member.guild.channels.find('name', 'general');
  if (!channel) {
    return;
  }
  channel.send(`Welcome to ${groupName}, ${member}.`);
  if (guestRole) {
    member
    .addRole(guestRole)
    .then(
      channel.send(
        `Your role is now ${entryRole}. ` +
        'Please contact the administrators to promote you ' +
        'in order to access more of this channel.'
      )
    )

      .catch(error => debug(error.message, 'error'));
  }
});

client.on('error', (error) => {
  debug(error.message, 'error');
  // if you want the whole error shown, enable the next line
  // debug(error, 'error');
});

client.on('warn', error => debug(error.message, 'warn'));
// enable if you want all the info from DiscordJS
// client.on('debug', e => debug(e));

client.login(discordToken);
