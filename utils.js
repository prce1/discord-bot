const debug = (string) => {
  // change en-GB to en-US if you want date and month reversed
  // eslint-disable-next-line no-console
  console.log(`${new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  }).format(new Date())}: ${string}`);
};

const DAY_OF_WEEK = [
  'sundays',
  'mondays',
  'tuesdays',
  'wednesdays',
  'thursdays',
  'fridays',
  'saturdays',
];

const ALPHABETEMOJI = [
  '🇦',
  '🇧',
  '🇨',
  '🇩',
  '🇪',
  '🇫',
  '🇬',
  '🇭',
  '🇮',
  '🇯',
  '🇰',
  '🇱',
  '🇲',
  '🇳',
  '🇴',
  '🇵',
  '🇶',
  '🇷',
  '🇸',
  '🇹',
  '🇺',
  '🇻',
  '🇼',
  '🇽',
  '🇾',
  '🇿',
];

const infoMessage = botName => (
  `**You have to mention (@${botName}) the bot to execute a command!**\n` +
  `eg: *@${botName} ping*\n` +
  'All the commands are case insensitive.\n' +
  'Available commands for this bot are:\n\n' +
  '**ping** :\n The bot tells you if it got a ping.\n\n' +
  '**get me popularity of ' +
  '*"place"*** (required)** on *"day"*** (optional)**' +
  ' at *"time"*** (optional) : \n' +
  'The bot returns the popualrity of a place based on populr.app.\n\n' +
  '**get me weather for *"address"*** (required)**, ' +
  '*"country"*** (optional) :\n ' +
  'The bot will tell you the weather for the given address, ' +
  'based on darksky.net.' +
  'The address can be either a full address, or just a city name. ' +
  'Full address assumes "StreetName StreetNumber CityName, Country".' +
  'If you don\'t enter a Country, it will default to RS(Serbia).\n\n' +
  '**play *"youtube url"*** (required) : \n' +
  'The bot plays a youtube video (audio only)' +
  ' in the voice channel you are currently in.\n\n' +
  '**stop** : \nThe bot stops the song playing & leaves the channel.\n\n' +
  '**remind me to *"reminder"* **(required)** in *"number"* ' +
  '**(required)** *"identifier"* **(eg. minutes, hours)(optional) :\n' +
  'The bot will send you a direct message with the reminder.\n\n' +
  '**poll:*question***(required)** [*answer*' +
  ']**(optional, can have as many answers as you want) :\n' +
  'The bot will send a poll' +
  '@everyone with reactions available as means of answering.\n\n'
);

 module.exports = {
  debug,
  infoMessage,
  DAY_OF_WEEK,
  ALPHABETEMOJI,
};
