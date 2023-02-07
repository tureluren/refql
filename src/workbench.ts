import { Pool } from "pg";
import { belongsTo, belongsToMany, hasMany, hasOne } from "./nodes";
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

const Player = Table ("player", [
  belongsTo ("team")
], querier);

const playerById = Player`
  id
  // first_name
  // last_name
  concat: full_name(first_name, ' ', last_name)
  ${sql`
    and id = 1 
  `}
`;


playerById ({ id: 1 }).then (console.log);
