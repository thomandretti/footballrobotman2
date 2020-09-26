import {
  Client as discord,
  DMChannel,
  MessageEmbed,
  NewsChannel,
  TextChannel,
} from "discord.js";
import scheduleJobPkg from "node-schedule";
import winston from "winston";
import { EspnWrapper, Team } from "./espnwrapper";

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

// eslint-disable-next-line import/prefer-default-export
export class FootballRobotMan {
  logger: winston.Logger;

  discordClient: discord;

  espnClient: EspnWrapper;

  seasonId: number;

  defaultChannelId: string;

  wordDetectionResponses: [{ word: string; response: string }];

  constructor(
    logger: winston.Logger,
    discordClient: discord,
    espnClient: EspnWrapper,
    seasonId: number,
    defaultChannelId: string,
    wordDetectionResponses: [{ word: string; response: string }]
  ) {
    this.logger = logger;
    this.discordClient = discordClient;
    this.espnClient = espnClient;
    this.seasonId = seasonId;
    this.defaultChannelId = defaultChannelId;
    this.wordDetectionResponses = wordDetectionResponses;
  }

  start(commandPrefix: string): void {
    this.discordClient.on("message", (message) => {
      this.logger.log(
        "info",
        `${message.channel.id} - ${message.author.username}: ${message.content}`
      );

      if (message.author.bot === true) {
        this.logger.log("info", "a bot sent this message, ignoring it");
        return;
      }
      this.wordDetectionResponses.forEach((element) => {
        if (message.content.toLowerCase().includes(element.word)) {
          this.logger.info(`message contains ${element.word}`);
          message.channel.send(element.response);
        }
      });

      if (message.content.toLowerCase().startsWith(commandPrefix)) {
        this.logger.log("info", "Prefix detected");
        const command = message.content
          .substring(commandPrefix.length)
          .trimStart();
        if (command === "standings") {
          this.logger.log("info", "request for standings");
          this.sendStandings(getWeekNumber(message.createdAt), message.channel);
        }
      }
    });
    scheduleJob({ dayOfWeek: 2, hour: 9, minute: 0 }, () => {
      this.sendStandings(
        getWeekNumber(new Date()),
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
    this.logger.log("info", `Sending standings for week ${weekNumber}`);

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
      .addField("\u200b", lines);

    await channel.send(embed);
  }
}
