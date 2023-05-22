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
  NumberProp ("goalCount", sql`
    select count (*) from goal
    where goal.player_id = player.id
  `)
]);

const topScorers = Player ([
  "id",
  "firstName",
  "lastName",
  "goalCount",
  sql`
    and (select count (*) from goal
    where goal.player_id = player.id) > 15
  `
]);


const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

topScorers ().then (console.log);

// firstTeam ({ limit: 11 }).fork (console.log, console.log);

// const playerBelongsToManyGames = BelongsToMany ("games", "game", {
//   lRef: "id",
//   rRef: "id",
//   lxRef: "player_id",
//   rxRef: "game_id",
//   xTable: "game_player"
// });
