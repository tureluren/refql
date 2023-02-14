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





const sql2 = <Params = unknown, Output = unknown> (strings: TemplateStringsArray, ...variables: SQLTagVariable<Params, Output, "Task">[]) => {
  const nodes = parse <Params, Output, "Task"> (strings, variables);
  return SQLTag (nodes, querier, promiseToTask);
};

const Table2 = (name: string, refs: Ref<"Task">[] = []) => {
  return Table<"Task"> (name, refs, querier, promiseToTask);
};

const taggie = sql2<{}, {id: number; first_name: string}[]>`
  select id, first_name
`;

const taggie2 = sql2<{}, {last_name: string}[]>`
  , last_name
  from player where id = 1
`;

const total = taggie.concat (taggie2) ({});

const Player = Table2 ("Player");

const taggie3 = Player<{}, {id: number; first_name: string}[]>`
  id
  first_name
`;

const taggie4 = Player<{}, {last_name: string}[]>`
  id
  first_name
  ${Raw ((p, t) => t)}
`;

const res1 = taggie3.concat (taggie4) ({}).map (res => res[0]);



// type test = Promise<{id: number; first_name: string}[]> & Promise<{last_name: string}[]>;


// const buh: test = Promise.resolve ([{ id: 1, first_name: "ronny", last_name: "Tureluren" }]);

// buh.then (res => res);

// #readme
// table setoid
// Raw functor
// RQLTag monoid
// defaults

const rawPart = Raw ("test");

const sqlellie = sql<{}, Player[]>`
`;