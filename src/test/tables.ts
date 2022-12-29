import Table from "../Table";
import { belongsTo, belongsToMany, hasMany, hasOne } from "../nodes";
import Ref from "../Ref";

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

const dummy = Table ("dummy");

const dummyRefInfo = {
  parent: Table ("player"),
  as: "dummy",
  lRef: Ref ("player.id", "dummylref"),
  rRef: Ref ("game.id", "dummyrref"),
  lxRef: Ref ("dummy_player.player_id", "dummylxref"),
  rxRef: Ref ("dummy_player.dummy_id", "dummyrxref"),
  xTable: Table ("dummy_player")
};

export {
  dummy,
  dummyRefInfo,
  game,
  gamePlayer,
  goal,
  league,
  position,
  player,
  rating,
  team
};