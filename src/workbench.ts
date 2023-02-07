import { Pool } from "pg";
import { belongsTo, belongsToMany, hasMany, hasOne, Raw, When } from "./nodes";
import sql from "./SQLTag/sql";
import Table from "./Table";

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

// dynamic properties
const idField = "id";
const bdField = "birthday";

const playerById = sql<{ id: number }>`
  select id, last_name, age (${Raw (bdField)})::text
  from player where ${Raw (idField)} = ${p => p.id}
`;

// query: select id, last_name, age (birthday)::text from player where id = $1
// values: [1]

playerById ({ id: 1 }, querier).then (console.log);
