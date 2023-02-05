import { Pool } from "pg";
import { belongsTo, belongsToMany, hasMany, hasOne } from "./nodes";
import { Player } from "./test/tables";
import sql from "./SQLTag/sql";
import Table from "./Table";

const Team = Table ("team", [hasMany ("player")]);
const Goal = Table ("goal");
const Rating = Table ("rating");
const Game = Table ("game");

// const Player = Table ("player", [
//   belongsTo ("team"),
//   hasMany ("goal"),
//   hasOne ("rating"),
//   belongsToMany ("game")
// ]);

const orderr = Player<{id: number}, Player>`
  id
`;

orderr ({ id: 3 }).then (p => p.birthday);

const byId = sql`
  ${orderr}
`;

// const tag = player<{}>`
//   ${team}
//   ${goal}
//   ${rating}
//   ${game}
//   ${byId}
// `;

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});


const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};
