import { Pool } from "pg";
import { belongsTo, hasOne } from "./nodes";
import { Player } from "./soccer";
import sql from "./SQLTag/sql";
import Table from "./Table";
import { game, league, player, rating, team } from "./test/tables";


const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const pgQuerier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};


// playerById.run<Player> (pgQuerier, { id: 1 }).then (console.log);

// [
//   {
//     id: 1,
//     first_name: 'David',
//     last_name: 'Roche',
//     team: { id: 1, name: 'FC Wezivduk', league_id: 1 }
//   }
// ]


// deep concat



const tag = game<{}>`
  ${team}
  ${sql`
    limit 1
  `}
`;

tag.run<any> (pgQuerier, {}).then (([game]) => console.log (game));