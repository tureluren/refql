import { Pool } from "pg";
import { belongsTo, belongsToMany, hasMany, hasOne } from "./nodes";
import sql from "./SQLTag/sql";
import Table from "./Table";

const team = Table ("team");
const goal = Table ("goal");
const rating = Table ("rating");
const game = Table ("game");

const player = Table ("player", [
  belongsTo ("team"),
  hasMany ("goal"),
  hasOne ("rating"),
  belongsToMany ("game")
]);

const byId = sql<{id: number}>`
  and id = ${p => p.id}
`;

const tag = player<{}>`
  ${team}
  ${goal}
  ${rating}
  ${game}
  ${byId}
`;

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

tag.run (querier, { id: 1 }).then (console.log);