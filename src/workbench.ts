import { Pool } from "pg";
import { Limit, setDefaultQuerier } from ".";
import { Player, Team } from "./test/tables";

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};

setDefaultQuerier (querier);


const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});


// select components
const playerLtd = Player ([
  "id",
  "firstName",
  "lastName",
  Team ([
    "id",
    "name"
  ]),
  Limit ()
]);

// and run
playerLtd ({ limit: 5 });