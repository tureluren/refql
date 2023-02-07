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

const playerPage = Player<{ limit?: number; offset?: number }>`
  id
  first_name
  ${When (p => p.limit != null, sql`
    limit ${p => p.limit} 
  `)}
  ${When (p => p.offset != null, sql`
    offset ${p => p.offset} 
  `)}
`;

playerPage ({ limit: 5, offset: 5 }).then (console.log);
