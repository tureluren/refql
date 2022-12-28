import { Pool } from "pg";
import { belongsTo } from "./nodes";
import { Player } from "./soccer";
import sql from "./SQLTag/sql";
import Table from "./Table";

// models
const player = Table ("player", [
  belongsTo ("team")
]);

const team = Table ("team");

// sql snippets
const byId = sql<{id: number}>`
  where id = ${p => p.id}
`;

// composition
const playerById = player`
  id
  first_name
  last_name
  ${team}
  ${byId}
`;

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const pgQuerier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};


playerById.run<Player> (pgQuerier, { id: 1 }).then (console.log);

// [
//   {
//     id: 1,
//     first_name: 'David',
//     last_name: 'Roche',
//     team: { id: 1, name: 'FC Wezivduk', league_id: 1 }
//   }
// ]