import { Pool } from "pg";
import { Ref, SQLTagVariable } from "./common/types";
import { belongsTo, belongsToMany } from "./nodes";
import SQLTag from "./SQLTag";
import sql, { parse } from "./SQLTag/sql";
import Table from "./Table";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};
