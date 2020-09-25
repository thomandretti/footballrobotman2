import { FootballRobotMan } from './footballrobotman';
import discordjs = require('discord.js');
import winston = require('winston');
import config = require('config');
import espnApi = require('espn-fantasy-football-api/node-dev');

import espnwrapper = require('./espnwrapper');

const {
  createLogger, format, transports,
} = winston;

const LOGGER = createLogger({
  format: format.combine(
    format.timestamp(),
    format.printf((info: winston.Logform.TransformableInfo & { timestamp?: number}) => (
      `${(info as { timestamp: number }).timestamp} ${info.level.toUpperCase()}: ${info.message}`
    )),
  ),
  transports: [new transports.Console()],
});

const discordClient = new discordjs.Client();

const espnClient = new espnApi.Client({ leagueId: config.get('espn.leagueId') });
espnClient.setCookies(config.get('espn.cookies'));

const fbrm = new FootballRobotMan(
  LOGGER,
  discordClient,
  espnClient as espnwrapper.EspnWrapper,
  config.get('espn.seasonId'),
  config.get('discord.defaultChannelId'),
  config.get('bot.wordDetectionResponses'),
);

discordClient.on('ready', () => {
  fbrm.start(config.get('bot.prefix'));
  LOGGER.log('info', 'Bot is up');
});

discordClient.login(config.get('discord.token')).then(() => {}, () => {});
