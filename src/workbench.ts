import { Pool } from "pg";
import { belongsTo, belongsToMany, hasMany, hasOne, Raw, Values, Values2D, When } from "./nodes";
import sql, { createSQLWithDefaultQuerier } from "./SQLTag/sql";
import Table, { createTableWithDefaultQuerier } from "./Table";

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

const Player = Table ("player", [
  hasMany ("goal")
], querier);

const byId = sql<{id: number}>`
  and id = ${p => p.id}
`;

const goalCount = sql<{}>`
  select count(*) from ${Goal}
  where player_id = player.id
`;

// select player.* from player where 1 = 1 and team_id = $1 order by player.first_name
const orderedTeamPlayers = Table ("Player")<{ team_id: number; order_by: string }>`
  *
  ${sql`
    and team_id = ${p => p.team_id}
    order by ${Raw ((p, t) => `${t}.${p.order_by}`)} 
  `}
`;


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

const taggie = Player<{}, any[]>`
  *
  ${sql`
    and id = 1 
  `}
 
`;

taggie.map (x => x[0]).run ({}, querier).then (console.log);