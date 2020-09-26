export interface Team {
  name: string;
  wins: number;
  losses: number;
  playoffSeed: number;
}

export interface EspnWrapper {
  getTeamsAtWeek(options: {
    seasonId: number;
    scoringPeriodId: number;
  }): Promise<Team[]>;
}
