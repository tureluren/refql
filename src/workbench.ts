import { Pool } from "pg";
import {
  BelongsTo, BelongsToMany, HasMany,
  HasOne, Limit, NumberProp, Offset,
  Querier,
  setConvertPromise,
  setDefaultQuerier,
  sql,
  StringProp, Table, When
} from ".";
import { Team } from "./test/tables";

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};

setDefaultQuerier (querier);


const Player = Table ("player", [
  NumberProp ("id"),
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  NumberProp ("teamId", "team_id").nullable ()
]);

const { teamId } = Player.props;

const firstTeam = Player ([
  "*",
  teamId.eq (1)
]);


const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

firstTeam ().then (console.log);

// firstTeam ({ limit: 11 }).fork (console.log, console.log);

// const playerBelongsToManyGames = BelongsToMany ("games", "game", {
//   lRef: "id",
//   rRef: "id",
//   lxRef: "player_id",
//   rxRef: "game_id",
//   xTable: "game_player"
// });