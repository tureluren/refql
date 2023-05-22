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
import { Player, Team } from "./test/tables";

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};

setDefaultQuerier (querier);

const id = NumberProp ("id");

const idAndFirstName = Player ([
  id,
  "firstName"
]);

const lastNameAndTeam = Player ([
  "lastName",
  Team (["name"]),
  id.eq<{ id: number }> (p => p.id)
]);

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const playerById = idAndFirstName
  .concat (lastNameAndTeam);

playerById ({ id: 1 }).then (res => res[0]);

// firstTeam ({ limit: 11 }).fork (console.log, console.log);

// const playerBelongsToManyGames = BelongsToMany ("games", "game", {
//   lRef: "id",
//   rRef: "id",
//   lxRef: "player_id",
//   rxRef: "game_id",
//   xTable: "game_player"
// });

const searchPlayer = Player ([
  "id",
  "lastName",
  When<{ q: string }> (p => p.q != null, sql`
    and last_name like ${p => `%${p.q}%`}
  `),
  When<{ limit: number }> (p => p.limit != null, sql`
    limit ${p => p.limit} 
  `)
]);

searchPlayer ({ limit: 5, q: "ba" }).then (console.log);
