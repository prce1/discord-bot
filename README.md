# Discord Bot

#### A small discord bot to use for your group chat, made using discord.js.



The bot has only a couple commands available, which are:
- ping
- weather
- popularity of a place (bar|night club|restaurant)
- playing youtube links over a voice channel


In order to get this bot working, after cloning the repo and running yarn|npm, you have to set up a few variables.

Create a .env file and set it up as follows:
```shell
DISCORD_TOKEN="YOUR DISCORD API TOKEN"
BOT_NAME="THE NAME OF YOUR BOT"
BOT_ID="THE ID OF YOUR BOT"
DISCORD_GROUP_NAME="THE NAME OF YOUR DISCORD GROUP / GUILD / SERVER"
DARKSKY_TOKEN="YOUR DARKSKY API TOKEN"
GOOGLE_TOKEN="YOUR GOOGLE GEOLOCATOR API TOKEN"
```
Getting all these will only take a couple of minutes.

First, you need to visit [Discord Developers](https://discordapp.com/developers/applications/), create an application, and get that info. You will need Client-ID *(The ID of your bot)*. You will also have to set it up as a bot, and then get it's TOKEN *(Your Discord API Token)* and USERNAME *(The Name of your bot)*.

After obtaining all of those, you will have to invite the bot to your Discord server. Replace the *CLIENTID* in the following link with your bot's Client-ID that you have gotten earlier:

  https://discordapp.com/oauth2/authorize?client_id=CLIENTID&scope=bot

and just select your server from the drop-down menu. You must have the Manage Server permission to add a bot to a server! If no servers appear, you may need to log in.

Note: *DISCORD_GROUP_NAME* can be whatever you want, but I recommend setting it to the name of the server you are running your bot in.

To get your *DARKSKY_TOKEN*, you should go to [Dark Sky](darksky.net/dev) and register. They will give you a key to use, and they have 1000(!) free calls per day.

Lastly, you will need a *GOOGLE_TOKEN*. You only need to get an API key for Google Geocoder, as you won't need other functionalities from them. You can go to [Get API Key | Geocoder](https://developers.google.com/maps/documentation/geocoding/get-api-key) and follow the instructions.


After setting all these up, just save the file and run yarn|npm start in your console, and you're good to go!


##### It should be noted that this is a work in progress, and should only be taken as such.
