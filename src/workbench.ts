import { Pool } from "pg";
import { Querier } from "./common/types";
import { Raw } from "./nodes";
import { convertSQLTagResult } from "./SQLTag";
import sql from "./SQLTag/sql";
import Table from "./Table";
import belongsTo from "./Table/belongsTo";
import dateProp from "./Table/dateProp";
import hasMany from "./Table/hasMany";
import numberProp from "./Table/numberProp";
import stringProp from "./Table/stringProp";
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

  return rows;
};

// const buh = varchar ("fullName", sql<{ table: string }>`
//     concat (first_name, " ", last_name)
//   `) ;

// const buh2 = varchar ("fullName") ;

// type IBUh = typeof buh.col;
// type IBUh2 = typeof buh2.col;



const Player = Table ("player", [
  numberProp ("id").arrayOf (),
  dateProp ("birthday", "birthday").nullable (),
  stringProp ("fullName", sql<{}>`
    concat (first_name, ' ', last_name)
  `),
  // stringProp ("firstName", "first_name"),
  // // ids: "foemp",
  // // firstName: varchar ("first_name"),
  belongsTo ("team", () => Team)
  // hasMany ("goals", "goal")
]);


const Team = Table ("team", [
  numberProp ("id", "id"),
  stringProp ("name", "name")
  // belongsTo ("league", "league")
]);

// const League = Table ("league", [
//   numberProp ("id", "id")
//   // ids: "foemp",
//   // leagueName: varchar ("name")
// ]);

// // const Goal = Table ("goal", [
// //   numberProp ("id", "id"),
// //   stringProp ("minute", "minute")
// // ]);

// // // const uuid = numberField ("uuid") ("uuiid");

// // // const lastName = Field<"lastName", string> ("lastName", "last_name");

const { id, birthday, fullName } = Player.props;


const byId = sql<{ id: number }>`
  and id = ${p => p.id}
`;

// // const andName = sql<{ name: string }>`
// //   and name = ${p => p.name}
// // `;

const playerById = Player ([
  "*",
  Team (["name"]),
  byId
]);

// // const playerRes = Player ([
// //   "age",
// //   byId,
// //   Team (["name"])
// // ]);

// // // const concatted = playerById.concat (playerRes);


playerById ({ id: 4 }, querier).then (res => console.log (res[0]));
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
