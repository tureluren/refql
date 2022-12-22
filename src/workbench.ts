import { Pool } from "pg";
import { Player } from "./soccer";
import sql from "./SQLTag/sql";

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

const tag = sql`
  select * from player
  limit 1
`;

tag.run<Player> (pgQuerier, {}).then (console.log);