import { Pool } from "pg";
import RefQL from ".";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 3308
});


const querier = async (query: string, values: any[]) => {
  console.log ("'" + query + "'");
  // console.log (values);
  const res = await pool.query (query, values);

  return res.rows;
};


const { tables, Table, sql } = RefQL ({
  querier
});

const { Player, Team, Game } = tables.public;

const test = Player ([
  "birthday",
  Team ([
    Game
  ])
]);

test ({}).then (res => res[0]);