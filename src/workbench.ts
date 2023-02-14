import { Pool } from "pg";
import { Ref, SQLTagVariable } from "./common/types";
import { Raw } from "./nodes";
import SQLTag from "./SQLTag";
import sql, { parse } from "./SQLTag/sql";
import Table from "./Table";
import { Player } from "./test/tables";

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

const Goal = Table ("goal");

// const Player = Table ("player", [
//   hasMany ("goal")
// ], querier);


// [
//   {
//     id: '9',
//     first_name: 'Phoebe',
//     last_name: 'van Dongen',
//     cars: null,
//     birthday: 1992-02-25T23:00:00.000Z,
//     team_id: 1,
//     position_id: 9,
//     goal_count: 6,
//     full_name: 'Phoebe van Dongen',
//     is_player: true,
//     first_goal: { id: 2, game_id: 1, player_id: 9, own_goal: false, minute: 30 }
//   }
// ]






// #readme
// table setoid
// Raw functor
// Raw contramap
// RQLTag monoid
