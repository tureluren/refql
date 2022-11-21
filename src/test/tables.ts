import Table from "../Table";
import belongsTo from "../Table/belongsTo";
import hasMany from "../Table/hasMany";
import hasOne from "../Table/hasOne";
import belongsToMany from "../Table/belongsToMany";

const game = Table ("game");
const gamePlayer = Table ("game_player");
const goal = Table ("goal");
const league = Table ("league");

const player = Table ("player", [
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

const position = Table ("position");

const team = Table ("public.team", [
  hasMany ("player", { as: "players" }),
  belongsTo ("league", {
    as: "league",
    lRef: "league_id",
    rRef: "id"
  })
]);

const rating = Table ("rating");

export {
  game,
  gamePlayer,
  goal,
  league,
  position,
  player,
  rating,
  team
};