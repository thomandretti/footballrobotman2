declare module "espn-fantasy-football-api/node-dev" {
  export interface Team {
    name: string;
    wins: number;
    losses: number;
    playoffSeed: number;
  }
  export class Client {
    constructor(options: { leagueId: number }): Client;
    getTeamsAtWeek(options: {
      seasonId: number;
      scoringPeriodId: number;
    }): Promise<Team[]>;

    setCookies(cookies: { espnS2: string; SWID: string }): void;
  }
}
