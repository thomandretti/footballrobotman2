import {
  DMChannel,
  Message,
  MessageEmbed,
  NewsChannel,
  TextChannel,
  Client as discord,
} from "discord.js";
import { Client as EspnClient, Team } from "espn-fantasy-football-api/node-dev";
import { DateTime } from "luxon";
import scheduleJobPkg from "node-schedule";
import winston from "winston";

import { Stonks } from "./stonks";

const { scheduleJob } = scheduleJobPkg;

const MILLISECONDS_IN_WEEK = 604800000;
const SEASON_START_DATE: Date = new Date("2020-09-15");

function compareTeams(teamOne: Team, teamTwo: Team): number {
  return teamOne.playoffSeed - teamTwo.playoffSeed;
}

function getWeekNumber(now: Date): number {
  const millisElapsed: number =
    now.getMilliseconds() - SEASON_START_DATE.getMilliseconds();
  return Math.ceil(millisElapsed / MILLISECONDS_IN_WEEK);
}

export interface BotConfig {
  prefix: string;
  wordDetectionResponses: [{ word: string; response: string }];
  pandl: PandLConfig;
}

export interface PandLConfig {
  stockSymbol: string;
  startingValue: number;
  upMessageTemplate: string;
  downMessageTemplate: string;
  evenMessage: string;
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
    this.config.wordDetectionResponses.forEach((element) => {
      if (message.content.toLowerCase().includes(element.word)) {
        this.logger.info(`message contains ${element.word}`);
        message.channel.send(element.response);
      }
    });

    if (message.content.toLowerCase().startsWith(this.config.prefix)) {
      this.logger.info("Prefix detected");
      const command = message.content
        .substring(this.config.prefix.length)
        .trimStart();

      // TODO: change this to a map lookup or something
      if (command === "standings") {
        this.logger.info("request for standings");
        this.sendStandings(getWeekNumber(message.createdAt), message.channel);
      } else if (command === "pot") {
        this.logger.info("request for pot");
        this.sendPot(message.channel);
      }
    }
  }

  start(): void {
    this.discordClient.on("message", (message) => this.handleMessage(message));

    scheduleJob({ dayOfWeek: 2, hour: 9, minute: 0 }, () => {
      this.sendStandings(
        getWeekNumber(new Date()),
        this.discordClient.channels.cache.get(
          this.defaultChannelId
        ) as TextChannel
      );
    });

    scheduleJob({ dayOfWeek: 12345, hour: 14, minute: 0 }, () => {
      this.sendPot(
        this.discordClient.channels.cache.get(
          this.defaultChannelId
        ) as TextChannel
      );
    });
  }

  private async sendStandings(
    weekNumber: number,
    channel: TextChannel | DMChannel | NewsChannel
  ): Promise<void> {
    this.logger.info(`Sending standings for week ${weekNumber}`);

    const teams = await this.espnClient.getTeamsAtWeek({
      seasonId: this.seasonId,
      scoringPeriodId: weekNumber,
    });

    teams.sort(compareTeams);
    const lines = teams
      .map(
        (element: Team) => `${element.wins}-${element.losses}: ${element.name}`
      )
      .join("\n");

    const embed = new MessageEmbed()
      .setTitle(`Week ${weekNumber} Standings`)
      .setDescription(lines);

    await channel.send(embed);
  }

  private async sendPot(
    channel: TextChannel | DMChannel | NewsChannel
  ): Promise<void> {
    const price = await this.stonks.getLatestClosePrice(
      this.config.pandl.stockSymbol
    );
    if (price === null) {
      this.logger.warn("Couldn't get stock price");
      return;
    }

    const earnings = price - this.config.pandl.startingValue;
    const percentChange = `($${Math.abs(
      (earnings / this.config.pandl.startingValue) * 100
    ).toFixed(0)}%)`;
    const earningsString = `$${Math.abs(earnings).toFixed(2)} ${percentChange}`;
    let pnlStatement: string;
    if (earnings > 0) {
      pnlStatement = this.config.pandl.upMessageTemplate.replace(
        "{0}",
        earningsString
      );
    } else if (earnings === 0) {
      pnlStatement = this.config.pandl.evenMessage;
    } else {
      pnlStatement = this.config.pandl.downMessageTemplate.replace(
        "{0}",
        earningsString
      );
    }

    const winningsMessage = `Winner's Take: $${(price * 0.9).toFixed(
      2
    )}\nRunner-up's Take: $${(price * 0.1).toFixed(2)}`;
    const embed = new MessageEmbed()
      .setTitle(`Pot Summary for ${DateTime.local().toLocaleString()}`)
      .setDescription(`Pot is currently worth $${price}`)
      .addField("P & L", pnlStatement)
      .addField("Winnings", winningsMessage);

    await channel.send(embed);
  }
}
