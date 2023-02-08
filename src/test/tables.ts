import Table from "../Table";
import { belongsTo, belongsToMany, hasMany, hasOne } from "../nodes";
import RefField from "../RefField";

interface League {
  id: number;
  name: string;
  teams: Team[];
}

interface Team {
  id: number;
  name: string;
  league: League;
  players: Player[];
}

interface Position {
  id: number;
  name: string;
}

interface Player {
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

interface Rating {
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

interface Game {
  id: number;
  homeTeamId: number;
  homeTeam: Team;
  awayTeamId: number;
  awayTeam: Team;
  leagueId: number;
  league: League;
  result: string;
}

interface Goal {
  id: number;
  gameId: number;
  game: Game;
  playerId: number;
  player: Player;
  ownGoal: boolean;
  minute: number;
}

interface Assist {
  id: number;
  gameId: number;
  game: Game;
  goalId: number;
  goal: Goal;
  playerId: number;
  player: Player;
}

const Game = Table ("game", [
  belongsTo ("league"),
  belongsTo ("public.team", { as: "home_team", lRef: "home_team_id" }),
  belongsTo ("public.team", { as: "away_team", lRef: "away_team_id" })
]);

const GamePlayer = Table ("game_player");
const Goal = Table ("goal");
const League = Table ("league");

const Player = Table ("player", [
  belongsTo ("public.team", {
    as: "team",
    lRef: "team_id",
    rRef: "id"
  }),
  belongsTo ("position"),
  hasOne ("rating", {
    as: "rating",
    lRef: "id",
    rRef: "player_id"
  }),
  hasMany ("goal", {
    as: "goals",
    lRef: "id",
    rRef: "player_id"
  }),
  belongsToMany ("game", { as: "games" })
]);

const Position = Table ("position");

const Team = Table ("public.team", [
  hasMany ("player", { as: "players" }),
  belongsTo ("league", {
    as: "league",
    lRef: "league_id",
    rRef: "id"
  })
]);

const Rating = Table ("rating");

const Assist = Table ("assist");

const Dummy = Table ("dummy");

const dummyRefInfo = {
  parent: Table ("player"),
  as: "dummy",
  lRef: RefField ("player.id", "dummylref"),
  rRef: RefField ("game.id", "dummyrref"),
  lxRef: RefField ("dummy_player.player_id", "dummylxref"),
  rxRef: RefField ("dummy_player.dummy_id", "dummyrxref"),
  xTable: Table ("dummy_player")
};

export {
  Assist,
  Dummy,
  dummyRefInfo,
  Game,
  GamePlayer,
  Goal,
  League,
  Position,
  Player,
  Rating,
  Team
};