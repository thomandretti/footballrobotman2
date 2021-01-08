import { Message, Client as discord } from "discord.js";
import { Client as EspnClient } from "espn-fantasy-football-api/node-dev";
import winston from "winston";

import { Stonks } from "./stonks";

export interface BotConfig {
  prefix: string;
  wordDetectionResponses: [WordDetectionConfig];
  pandl: PandLConfig;
}

export interface PandLConfig {
  stockSymbol: string;
  startingValue: number;
  upMessageTemplate: string;
  downMessageTemplate: string;
  evenMessage: string;
}

export interface WordDetectionConfig {
  word: string;
  response: string;
}

export class FootballRobotMan {
  readonly logger: winston.Logger;

  readonly discordClient: discord;

  readonly espnClient: EspnClient;

  readonly seasonId: number;

  readonly defaultChannelId: string;

  readonly stonks: Stonks;

  readonly config: BotConfig;

  constructor(
    logger: winston.Logger,
    discordClient: discord,
    espnClient: EspnClient,
    seasonId: number,
    defaultChannelId: string,
    stonks: Stonks,
    config: BotConfig
  ) {
    this.logger = logger;
    this.discordClient = discordClient;
    this.espnClient = espnClient;
    this.seasonId = seasonId;
    this.defaultChannelId = defaultChannelId;
    this.stonks = stonks;
    this.config = config;
  }

  handleMessage(message: Message): void {
    this.logger.info(
      `${message.channel.id} - ${message.author.username}: ${message.content}`
    );

    if (message.author.bot === true) {
      this.logger.info("a bot sent this message, ignoring it");
      return;
    }
    this.config.wordDetectionResponses.forEach(
      (element: WordDetectionConfig) => {
        this.logger.info(`Looking for ${element.word} in ${message.content}`);
        if (message.content.toLowerCase().includes(element.word)) {
          this.logger.info(`message contains ${element.word}`);
          message.channel.send(element.response);
        }
      }
    );
  }

  start(): void {
    this.discordClient.on("message", (message) => this.handleMessage(message));
  }
}
