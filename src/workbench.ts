import { Pool } from "pg";
import { belongsTo } from "./nodes";
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

interface Team {
  id: number;
  name: string;
}

const Team = Table ("team");

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
}

const Player = Table ("player", [
  belongsTo ("team")
]);
