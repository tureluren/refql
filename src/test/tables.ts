import Table from "../Table";
import belongsTo from "../Table/belongsTo";
import hasMany from "../Table/hasMany";
import hasOne from "../Table/hasOne";
import belongsToMany from "../Table/belongsToMany";

const Game = Table ("game");
const GamePlayer = Table ("game_player");
const Goal = Table ("goal");
const League = Table ("league");

const Player = Table ("player", [
  belongsTo ("public.team", {
    as: "team",
    lRef: "team_id",
    rRef: "id"
  }),
  belongsTo ("position", {
    as: "position",
    lRef: "position_id",
    rRef: "id"
  }),
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
  belongsToMany ("game", {
    xTable: "game_player",
    as: "games",
    lRef: "id",
    rRef: "id",
    rxRef: "player_id",
    lxRef: "game_id"
  })
]);

const Position = Table ("position");



const Team = Table ("public.team", [
  hasMany ("player", {
    as: "players",
    lRef: "id",
    rRef: `team_id`
  })
]);



const Rating = Table ("rating");

// const qry = Player`
//   id
//   ${Position`
//     id
//   `}
// `;

export {
  Game,
  GamePlayer,
  Goal,
  League,
  Position,
  Player,
  Rating,
  Team
};