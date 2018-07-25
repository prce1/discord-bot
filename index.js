/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

require('dotenv').config();
const fetch = require('node-fetch');
const Discord = require('discord.js');
const isString = require('lodash/isString');
const ytdl = require('ytdl-core');


const botID = process.env.BOT_ID;
const botName = process.env.BOT_NAME;
const groupName = process.env.DISCORD_GROUP_NAME;
const googleKey = process.env.GOOGLE_TOKEN;
const darkSkyKey = process.env.DARKSKY_TOKEN;
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`${groupName} bot is up and running`); // eslint-disable-line no-console
  // client.channels.find('name', 'general')
  // .send(`${groupName} bot is up and running`);
  // client.channels.find('name', 'general')
  // .send(`If you want a list of all commands, type "@${botName} help"`);
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
  /^play ([^]+)$/i,
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
      message.reply('you need to join a channel first!');
    }
  },
], [
  'stop',
  (message) => {
    message.member.voiceChannel.leave();
    client.user.setActivity();
  },
], [
  /^get me weather for ([^,]+)(?:, ([^\s]+))?/i,
  (message, [_, cityL, countryL = 'RS']) => {
    const city = cityL.split(' ').join('+');
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${city},+${
        countryL}&key=${googleKey}`
    )
    .then(res => res.json()
    .then((result) => {
      if (result.status !== 'OK') {
        message.channel.send('You have entered an invalid address.');
      } else {
        const { lat, lng } = result.results[0].geometry.location;
        const address = result.results[0].formatted_address;
        fetch(`https://api.darksky.net/forecast/${darkSkyKey}/${
          lat
        }, ${lng}?units=si`)
        .then(resOne => resOne.json())
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
        .catch(error => console.error(error)); // eslint-disable-line no-console
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
        ? (new Date().getHours() + 1)
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
        let day = DAY_OF_WEEK.indexOf(dayInput);
        const time = parseInt(timeInput, 10);
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
        message.channel.send(`The popularity of ${name} on ${dayInput} at ${
          time}h is ${value}/100.\n${value < 20
          ? 'The place *isn\'t popular* at all at this time.'
          : value < 65
          ? 'The place *looks good*, but not really full at this time.'
          : 'The place is *very hot* at this time!'}`
        );
      } else {
        throw new StraightResponseError(
          `Cannot find place "${slug}".`
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


client.login(process.env.DISCORD_TOKEN);
