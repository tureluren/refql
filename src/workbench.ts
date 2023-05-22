import { Pool } from "pg";
import {
  BelongsTo, BelongsToMany, HasMany,
  HasOne, Limit, NumberProp, Offset,
  Querier,
  Raw,
  setConvertPromise,
  setDefaultQuerier,
  sql,
  StringProp, Table, Values, Values2D, When
} from ".";
import { Team } from "./test/tables";

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};

setDefaultQuerier (querier);




const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});


// firstTeam ({ limit: 11 }).fork (console.log, console.log);

// const playerBelongsToManyGames = BelongsToMany ("games", "game", {
//   lRef: "id",
//   rRef: "id",
//   lxRef: "player_id",
//   rxRef: "game_id",
//   xTable: "game_player"
// });


// dynamic properties
interface Player {
  first_name: string;
  last_name: string;
}

const Player = Table ("player", []);

const insertBatch = sql<{ fields: (keyof Player)[]; data: Player[] }, Player[]>`
  insert into ${Player} (${Raw (p => p.fields.join (", "))})
  values ${Values2D (p => p.data.map (x => p.fields.map (f => x[f])))}
  returning *
`;

insertBatch ({
  fields: ["first_name", "last_name"],
  data: [
    { first_name: "John", last_name: "Doe" },
    { first_name: "Jane", last_name: "Doe" },
    { first_name: "Jimmy", last_name: "Doe" }
  ]
}).then (console.log);
