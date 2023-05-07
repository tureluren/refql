import { Pool } from "pg";
import { Querier } from "./common/types";
import { Raw, When } from "./nodes";
import { convertSQLTagResult } from "./SQLTag";
import sql from "./SQLTag/sql";
import Table from "./Table";
import belongsTo from "./Table/belongsTo";
import belongsToMany from "./Table/belongsToMany";
import dateProp from "./Table/dateProp";
import hasMany from "./Table/hasMany";
import hasOne from "./Table/hasOne";
import numberProp from "./Table/numberProp";
import stringProp from "./Table/stringProp";
import { Game, League, Player, Rating, Team } from "./test/tables";
import Task, { promiseToTask } from "./test/Task";


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
  console.log (rows);

  return rows;
};

// const buh = varchar ("fullName", sql<{ table: string }>`
//     concat (first_name, " ", last_name)
//   `) ;

// const buh2 = varchar ("fullName") ;

// type IBUh = typeof buh.col;
// type IBUh2 = typeof buh2.col;


// const Game = Table ("game", [
//   numberProp ("id", "id"),
//   stringProp ("result", "result"),
//   belongsTo ("homeTeam", () => Team, { lRef: "home_team_id" }),
//   belongsTo ("awayTeam", () => Team, { lRef: "away_team_id" })
// ]);

// const Player = Table ("player", [
//   numberProp ("id").arrayOf (),
//   dateProp ("birthday", "birthday").nullable (),
//   stringProp ("fullName", sql<{}>`
//     concat (first_name, ' ', last_name)
//   `),
//   // stringProp ("firstName", "first_name"),
//   // // ids: "foemp",
//   // // firstName: varchar ("first_name"),
//   belongsTo ("team", () => Team),
//   belongsToMany ("games", () => Game),
//   hasMany ("goals", "goal"),
//   hasOne ("rating", "rating")
// ]);

// const Rating = Table ("rating", [
//   numberProp ("playerId", "player_id"),
//   numberProp ("acceleration", "acceleration")
//   // belongsTo ("league", "league")
// ]);

// const Team = Table ("public.team", [
//   numberProp ("id", "id"),
//   stringProp ("name", "name")
//   // belongsTo ("league", "league")
// ]);

// // const League = Table ("league", [
// //   numberProp ("id", "id")
// //   // ids: "foemp",
// //   // leagueName: varchar ("name")
// // ]);

// const Goal = Table ("goal", [
//   numberProp ("id", "id"),
//   stringProp ("minute", "minute")
// ]);


// // // // const uuid = numberField ("uuid") ("uuiid");

// // // // const lastName = Field<"lastName", string> ("lastName", "last_name");

// const { id, birthday, fullName } = Player.props;


// const byId = sql<{ id: number }>`
//   and id = ${p => p.id}
// `;

// // // const andName = sql<{ name: string }>`
// // //   and name = ${p => p.name}
// // // `;

// const playerById = Player ([
//   "id",
//   // Game (["result"]),
//   Team (["id"]),
//   Goal (["*"]),
//   Rating (["*"]),
//   Game ([Team (["name"])]),
//   byId
// ]);

// const playerTeam = Player ([
//   "*",
//   Team ([
//     "name"
//   ])
// ]);

const whenie = When (p => p.query != null, sql<{ query: string }>` and last_name = '${p => p.query}'`);

// const tag = Player ([
//   "id",
//   "firstName",
//   "lastName",
//   Team ([
//     "name",
//     League (["name"]),
//     Player (["lastName", sql`limit 5`])
//   ]),
//   Game (["result"]),
//   Rating (["acceleration", "stamina"]),
//   whenie,
//   sql<{}>`
//     limit 30
//       `
// ]);
// const playerAndTeam = playerById.concat (playerTeam);

// // const playerRes = Player ([
// //   "age",
// //   byId,
// //   Team (["name"])
// // ]);

// // // const concatted = playerById.concat (playerRes);


// tag ({ query: "" }, querier).then (res => console.log (res[2]));
// // natural transformation

// declare module "./SQLTag" {
//   interface SQLTag<Params, Output> {
//     (params: Params, querier?: Querier): Task<Output>;
//   }
// }

// convertSQLTagResult (promiseToTask);

// const simpleTag = sql<{firstNameField: string}, { id: number; first_name: string}[]>`
//   select id, ${Raw (p => p.firstNameField)}
// `;

// const simpleTag2 = sql<{limit: number}, { last_name: string}[]>`
//   , last_name
//   from player
//   limit ${p => p.limit}
// `;

// const combined = simpleTag.concat (simpleTag2);


// // combined.co




// combined ({ firstNameField: "first_name", limit: 2 }, querier).fork (console.log, console.log);

const tag2 = Game ([
  "id",
  Team (["id", "name"]),
  sql`
    and home_team_id = 1
    and away_team_id = 2
    limit 1
  `
]);

tag2 ({}, querier).then (console.log);