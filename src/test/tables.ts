import Table from "../Table";
import belongsTo from "../Table/belongsTo";
import hasMany from "../Table/hasMany";
import hasOne from "../Table/hasOne";
import belongsToMany from "../Table/belongsToMany";

const Game = Table ("game");
const GamePlayer = Table ("game_player");
const Goal = Table ("goal");

// als tabel niet gevonden wordt, error: tabel niet gerelateerd of niet in registry
// const Table = makeTable ()
//   // array
//   tables
// );

// const Player = Table ("player", [
//   belongsTo ("team")
// ]);


const Player: Table = Table ("player", [
  belongsTo (() => ({
    table: Team,
    as: "team",
    lRef: "team_id",
    rRef: "id"
  })),
  belongsTo (() => ({
    table: Position,
    as: "position",
    lRef: "position_id",
    rRef: "id"
  })),
  hasOne (() => ({
    table: Rating,
    as: "rating",
    lRef: "id",
    rRef: "player_id"
  })),
  hasMany (() => ({
    table: Goal,
    as: "goals",
    lRef: "id",
    rRef: "player_id"
  })),
  belongsToMany (() => ({
    table: Game,
    xTable: GamePlayer,
    as: "games",
    lRef: "id",
    rRef: "id",
    rxRef: "player_id",
    lxRef: "game_id"
  }))
]);

const Position = Table ("position");



const Team = Table ("public.team", [
  hasMany (team => ({
    table: Player,
    as: "players",
    lRef: "id",
    rRef: `${team}_id`
  }))
]);



const Rating = Table ("rating");

const qry = Player`
  id
  ${Position`
    id
  `}
`;

export {
  Game,
  GamePlayer,
  Goal,
  Position,
  Player,
  Rating,
  Team
};