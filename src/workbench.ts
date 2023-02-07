import { Pool } from "pg";
import { belongsTo, belongsToMany, hasMany, hasOne, When } from "./nodes";
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

const searchPlayer = Player<{ q?: string; limit?: number }>`
  id
  last_name
  ${When (p => p.q != null, sql`
    and last_name like ${p => `%${p.q}%`}
  `)}
  ${When (p => p.limit != null, sql`
    limit ${p => p.limit} 
  `)}
`;

searchPlayer ({ limit: 5, q: "ba" }).then (console.log);
