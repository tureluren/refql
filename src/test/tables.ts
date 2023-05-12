import Table from "../Table";
import RefField from "../RefField";
import numberProp from "../Table/numberProp";
import hasMany from "../Table/hasMany";
import belongsTo from "../Table/belongsTo";
import stringProp from "../Table/stringProp";
import hasOne from "../Table/hasOne";
import belongsToMany from "../Table/belongsToMany";
import booleanProp from "../Table/booleanField";
import sql from "../SQLTag/sql";
import Raw from "../SQLTag/Raw";

const id = numberProp ("id");
const name = stringProp ("name");

const Position = Table ("game", [
  id,
  name
]);

const Rating = Table ("rating", [
  numberProp ("playerId", "player_id"),
  numberProp ("acceleration"),
  numberProp ("finishing"),
  numberProp ("positioning"),
  numberProp ("shotPower", "shot_power"),
  numberProp ("freeKick", "free_kick"),
  numberProp ("stamina"),
  numberProp ("dribbling"),
  numberProp ("tackling")
]);

const League = Table ("league", [
  id,
  name,
  hasMany ("teams", "public.team")
]);

const Team = Table ("public.team", [
  id,
  name,
  hasMany ("players", "player"),
  belongsTo ("league", "league")
]);

const Player = Table ("player", [
  id,
  stringProp ("firstName", "first_name"),
  stringProp ("lastName", "last_name"),
  stringProp ("fullName", sql<{ delimiter: string }>`
    concat (player.first_name, ${Raw (p => `'${p.delimiter}'`)}, player.last_name)
  `),
  numberProp ("goalCount", sql<{}>`
    select count (*)::int from goal
    where goal.player_id = player.id
  `),
  stringProp ("cars").arrayOf (),
  stringProp ("birthday"),
  numberProp ("teamId", "team_id").nullable (),
  belongsTo ("team", "public.team"),
  numberProp ("positionId", "position_id"),
  belongsTo ("position", "position"),
  hasOne ("rating", "rating"),
  hasMany ("goals", "goal"),
  belongsToMany ("games", "game")
]);

const Player2 = Table ("player", [
  id,
  stringProp ("firstName", "first_name"),
  stringProp ("lastName", "last_name"),
  stringProp ("birthday"),
  numberProp ("teamId", "team_id"),
  belongsTo ("team", "public.team", {
    lRef: "TEAM_ID",
    rRef: "ID"
  }),
  numberProp ("positionId", "position_id"),
  hasOne ("rating", "rating", {
    lRef: "ID",
    rRef: "PLAYER_ID"
  }),
  hasMany ("goals", "goal", {
    lRef: "ID",
    rRef: "PLAYER_ID"
  }),
  belongsToMany ("games", "game", {
    xTable: "GAME_PLAYER"
  }),
  belongsToMany ("xgames", "xgame", {
    lRef: "ID",
    lxRef: "PLAYER_ID",
    rxRef: "XGAME_ID",
    rRef: "ID"
  })
]);

const XGame = Table ("xgame", [
  id,
  stringProp ("result"),
  numberProp ("homeTeamId", "home_team_id"),
  numberProp ("awayTeamId", "away_team_id"),
  belongsTo ("homeTeam", "public.team", { lRef: "home_team_id" }),
  belongsTo ("awayTeam", "public.team", { lRef: "away_team_id" }),
  numberProp ("leagueId", "league_id"),
  belongsTo ("league", "league")
]);

const Game = Table ("game", [
  id,
  stringProp ("result"),
  numberProp ("homeTeamId", "home_team_id"),
  numberProp ("awayTeamId", "away_team_id"),
  belongsTo ("homeTeam", "public.team", { lRef: "home_team_id" }),
  belongsTo ("awayTeam", "public.team", { lRef: "away_team_id" }),
  numberProp ("leagueId", "league_id"),
  belongsTo ("league", "league")
]);

const Goal = Table ("goal", [
  id,
  numberProp ("minute"),
  numberProp ("playerId", "player_id"),
  numberProp ("gameId", "game_id"),
  booleanProp ("ownGoal", "own_goal"),
  belongsTo ("game", "game"),
  belongsTo ("player", "player")
]);

const Assist = Table ("assist", [
  id,
  numberProp ("playerId", "player_id"),
  numberProp ("gameId", "game_id"),
  numberProp ("goalId", "goal_id"),
  belongsTo ("game", "game"),
  belongsTo ("player", "player"),
  belongsTo ("goal", "goal")
]);


const GamePlayer = Table ("game_player", []);

export {
  Assist,
  Game,
  GamePlayer,
  Goal,
  League,
  Position,
  Player,
  Rating,
  Team,
  Player2,
  XGame
};