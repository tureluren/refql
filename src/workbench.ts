import { Pool } from "pg";
import { Player, Team } from "./test/tables";

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

const tag = Player ([
  "fullName",
  "firstName",
  "lastName",
  "firstGoalId",
  Team (["*"])
]);

tag ({ delimiter: " " }, querier).then (res => console.log (res[9]));