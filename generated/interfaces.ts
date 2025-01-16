export interface Setting {
  id: number;
  keyName: string;
  keyValue: string;
}

export interface League {
  id: number;
  name?: string;
  games: Game[];
  teams: Team[];
}

export interface Team {
  id: number;
  active?: boolean;
  leagueId?: number;
  name?: string;
  league?: League;
  games: Game[];
  players: Player[];
}

export interface Player {
  birthday?: any;
  teamId?: number;
  positionId?: number;
  id: number;
  cars?: any;
  firstName?: string;
  lastName?: string;
  position?: Position;
  team?: Team;
  assists: Assist[];
  gamePlayers: GamePlayer[];
  goals: Goal[];
  rating?: Rating;
}

export interface Position {
  id: number;
  name?: string;
  players: Player[];
}

export interface Game {
  id: number;
  date?: any;
  homeTeamId?: number;
  awayTeamId?: number;
  leagueId?: number;
  result?: string;
  awayTeam?: Team;
  homeTeam?: Team;
  league?: League;
  assists: Assist[];
  gamePlayers: GamePlayer[];
  goals: Goal[];
}

export interface GamePlayer {
  playerId: number;
  gameId: number;
  game: Game;
  player: Player;
  assists: Assist[];
  goals: Goal[];
}

export interface Goal {
  id: number;
  gameId?: number;
  playerId?: GamePlayer;
  ownGoal?: boolean;
  minute?: number;
  game?: Game;
  player?: Player;
  assists: Assist[];
}

export interface Assist {
  id: number;
  gameId?: number;
  goalId?: number;
  playerId?: GamePlayer;
  game?: Game;
  goal?: Goal;
  player?: Player;
}

export interface Rating {
  playerId?: number;
  acceleration?: number;
  finishing?: number;
  positioning?: number;
  shotPower?: number;
  freeKick?: number;
  stamina?: number;
  dribbling?: number;
  tackling?: number;
  player?: Player;
}