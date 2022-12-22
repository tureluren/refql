export interface League {
  id: number;
  name: string;
  teams: Team[];
}

export interface Team {
  id: number;
  name: string;
  league: League;
  players: Player[];
}

export interface Position {
  id: number;
  name: string;
}

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string;
  teamId: number;
  team: Team;
  positionId: number;
  position: Position;
  goals: Goal[];
  games: Game[];
  rating: Rating;
}

export interface Rating {
  playerId: number;
  acceleration: number;
  finishing: number;
  positioning: number;
  shotPower: number;
  freeKick: number;
  stamina: number;
  dribbling: number;
  tackling: number;
}

export interface Game {
  id: number;
  homeTeamId: number;
  homeTeam: Team;
  awayTeamId: number;
  awayTeam: Team;
  leagueId: number;
  league: League;
  result: string;
}

export interface Goal {
  id: number;
  gameId: number;
  game: Game;
  playerId: number;
  player: Player;
  ownGoal: boolean;
  minute: number;
}

export interface Assist {
  id: number;
  gameId: number;
  game: Game;
  goalId: number;
  goal: Goal;
  playerId: number;
  player: Player;
}