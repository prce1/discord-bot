/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

require('dotenv').config();

const fetch = require('node-fetch');
const Discord = require('discord.js');
const isString = require('lodash/isString');
const ytdl = require('ytdl-core');

const botID = process.env.BOT_ID;
const botName = process.env.BOT_NAME;
const discordToken = process.env.CLIENT_TOKEN;
const groupName = process.env.DISCORD_GROUP_NAME;

const client = new Discord.Client();

client.on('ready', () => {
  console.log(`${groupName} bot is up and running`); // eslint-disable-line no-console
  // client.channels.find('name', 'general')
  // .send(`${groupName} bot is up and running.`);
  // client.channels.find('name', 'general')
  // .send(`If you want a list of all commands, type "@${botName} help".`);
});

class StraightResponseError extends Error {}

const DAY_OF_WEEK = [
  'sundays',
  'mondays',
  'tuesdays',
  'wednesdays',
  'thursdays',
  'fridays',
  'saturdays',
];

const HANDLERS = [[
  'ping',
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
      }).catch(error => console.error(error)); // eslint-disable-line no-console
    } else {
      message.reply('You need to join a channel first!');
    }
    message.delete(3000)
      // eslint-disable-next-line no-console
      .then(msg => console.log(`Deleted message from ${msg.author.username}`))
      // eslint-disable-next-line no-console
      .catch(console.error);
  },
], [
  'stop',
  (message) => {
    message.member.voiceChannel.leave();
    client.user.setActivity();
    message.delete(3000)
      // eslint-disable-next-line no-console
      .then(msg => console.log(`Deleted message from ${msg.author.username}`))
      // eslint-disable-next-line no-console
      .catch(console.error);
  },
], [
  /^get me weather for ([^,]+)(?:, ([^\s]+))?/i,
  (message, [_, cityL, country = 'RS']) => {
    const city = cityL.split(' ').join('+');
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${city},+${
        country}&key=${process.env.GOOGLE_TOKEN}`
    )
    .then(res => res.json()
    .then((resJson) => {
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
        })
        .catch((error) => {
          console.error(error); // eslint-disable-line no-console
          if (error instanceof StraightResponseError) {
            message.channel.send(error);
          } else {
            message.channel.send(`Something went wrong: ${error}`);
          }
        });
      }
    }));
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
      console.error(error); // eslint-disable-line no-console
      if (error instanceof StraightResponseError) {
        message.channel.send(error.message);
      } else {
        message.channel.send(`Oops, something went wrong: ${error.message}.`);
      }
    });
  },
], [
  /remind me to (.+) in (\d+) ([^\s]+)/i,
  (message, [_, reminder, number, identifier = 'minutes']) => {
    let time = {};
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
      console.log(`Sent reminder: ${reminder}.`); // eslint-disable-line no-console
      message.author.send(`You need to ${reminder}!`);
    }, time, message);
  },
], [
  'help',
  message => (
    message.author.send(
      `**You have to mention (@${botName}) the bot to execute a command!**\n` +
      `eg: *@${botName} ping*\n` +
      'All the commands are case insensitive.\n' +
      'Available commands for this bot are:\n\n' +
      '**ping** : The bot tells you if it got a ping.\n\n' +
      '**get me popularity of ' +
      '*"place"*** (required)** on *"day"*** (optional)**' +
      ' at *"time"*** (optional) : ' +
      'The bot returns the popualrity of a place based on populr.app.\n\n' +
      '**get me weather for *"address"*** (required)**, ' +
      '*"country"*** (optional) : ' +
      'The bot returns weather for given city, ' +
      'based on darksky.net.\n' +
      'The address can be either a full address, or just a city name.' +
      'Full address assumes "StreetName StreetNumber CityName, Country".' +
      'If you don\'t enter a Country, it will default to RS(Serbia).\n\n' +
      '**play *"youtube url"*** (required) : ' +
      'The bot plays a youtube video (audio only)' +
      ' in the voice channel you are currently in.\n\n' +
      '**stop** : The bot stops the song playing & leaves the channel.'
    )
  ),
]].map(([test, callback]) => ([
  isString(test)
  ? new RegExp(
      `^${test.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, // eslint-disable-line no-useless-escape
      '\\$&')}$`,
      'i'
    )
  : test,
  callback,
]));

client.on('message', (message) => { // eslint-disable-line consistent-return
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
          // message.delete(1000 * 15);
          return callback(message, match);
        }
      }
    // } else if (message.author.username === `${botName}`) {
    //   message.delete(1000 * 3 * 60);
    }
  }
});

client.on('guildMemberAdd', (member) => {
  const channel = member.guild.channels.find('name', 'general');
  if (!channel) {
    return;
  }
  channel.send(`Welcome to ${groupName}, ${member}`);
});

client.on('disconnected', (error) => {
  console.error(error); // eslint-disable-line no-console
    client.destroy().then(client.login(discordToken));
});

client.on('error', (error) => {
  console.error(error); // eslint-disable-line no-console
  console.log('reconnecting after an error'); // eslint-disable-line no-console
    client.destroy().then(client.login(discordToken));
});

client.login(discordToken);
