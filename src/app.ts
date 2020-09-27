import alphavantage from "alphavantage";
import config from "config";
import discordjs from "discord.js";
import winston from "winston";

import { Client as EspnClient } from "espn-fantasy-football-api/node-dev";
import { FootballRobotMan } from "./footballrobotman";
import { AlphaVantageClient, Stonks } from "./stonks";

const { createLogger, format, transports } = winston;

const LOGGER = createLogger({
  format: format.combine(
    format.timestamp(),
    format.printf(
      (info: winston.Logform.TransformableInfo & { timestamp?: number }) =>
        `${
          (info as { timestamp: number }).timestamp
        } ${info.level.toUpperCase()}: ${info.message}`
    )
  ),
  transports: [new transports.Console()],
});

const discordClient = new discordjs.Client();

const espnClient = new EspnClient({
  leagueId: config.get("espn.leagueId"),
});
espnClient.setCookies(config.get("espn.cookies"));

const stonks = new Stonks(
  alphavantage({ key: config.get("alphavantage.key") }) as AlphaVantageClient
);

const fbrm = new FootballRobotMan(
  LOGGER,
  discordClient,
  espnClient,
  config.get("espn.seasonId"),
  config.get("discord.defaultChannelId"),
  stonks,
  config.get("bot")
);

discordClient.on("ready", () => {
  fbrm.start();
  LOGGER.info("Bot is up");
});

discordClient.login(config.get("discord.token")).then(
  () => {},
  () => {}
);
