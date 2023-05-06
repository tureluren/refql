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

const id = numberProp ("id");
const name = numberProp ("name");

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
  belongsTo ("league", "league", {
    lRef: "league_id",
    rRef: "id"
  })
]);

// implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
// const Team = Table ("public.team", [
//   id,
//   name,
//   hasMany ("player", () => Player),
//   belongsTo ("league", "league", {
//     lRef: "league_id",
//     rRef: "id"
//   })
// ]);


const Player = Table ("player", [
  id,
  stringProp ("firstName", "first_name"),
  stringProp ("lastName", "last_name"),
  stringProp ("fullName", sql<{}>`
    concat (player.first_name, ' ', player.last_name)
  `),
  numberProp ("goalCount", sql<{}>`
    select count (*)::int from goal
    where goal.player_id = player.id
  `),
  stringProp ("birthday"),
  numberProp ("teamId", "team_id"),
  belongsTo ("team", "public.team", {
    lRef: "team_id",
    rRef: "id"
  }),
  numberProp ("positionId", "position_id"),
  belongsTo ("position", "position"),
  hasOne ("rating", "rating", {
    lRef: "id",
    rRef: "player_id"
  }),
  hasMany ("goals", "goal", {
    lRef: "id",
    rRef: "player_id"
  }),
  belongsToMany ("games", "game")
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

const Dummy = Table ("dummy", []);

const dummyRefInfo = {
  parent: Player,
  as: "dummy",
  lRef: RefField ("player.id", "dummylref"),
  rRef: RefField ("game.id", "dummyrref"),
  lxRef: RefField ("dummy_player.player_id", "dummylxref"),
  rxRef: RefField ("dummy_player.dummy_id", "dummyrxref"),
  xTable: Table ("dummy_player", [])
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