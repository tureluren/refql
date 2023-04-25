import { Pool } from "pg";
import { Raw } from "./nodes";
import SQLTag2 from "./SQLTag2";
import sql from "./SQLTag2/sql";
import Table2 from "./Table2";
import belongsTo from "./Table2/belongsTo";
import Field from "./Table2/Field";
import hasMany from "./Table2/hasMany";
import numberProp from "./Table2/numberProp";
import stringProp from "./Table2/stringProp";


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


const Player = Table2 ("player", [
  numberProp ("id").arrayOf (),
  numberProp ("age", "age").nullable (),
  stringProp ("fullName", sql<{ table: string }>`
    concat (first_name, " ", last_name)
  `),
  stringProp ("firstName", "first_name"),
  // ids: "foemp",
  // firstName: varchar ("first_name"),
  belongsTo ("team", "team"),
  hasMany ("goals", "goal")
]);

const Team = Table2 ("team", [
  numberProp ("id", "id"),
  stringProp ("name", "name"),
  belongsTo ("league", "league")
]);

const League = Table2 ("league", [
  numberProp ("id", "id")
  // ids: "foemp",
  // leagueName: varchar ("name")
]);

const Goal = Table2 ("goal", [
  numberProp ("id", "id"),
  stringProp ("minute", "minute")
]);

// const uuid = numberField ("uuid") ("uuiid");

// const lastName = Field<"lastName", string> ("lastName", "last_name");

const { team, id, age, fullName } = Player.props;


const byId = sql<{ id: number }, typeof Player>`
  and id = ${p => p.id}
`;

const andName = sql<{ name: string }>`
  and name = ${p => p.name}
`;

const playerById = Player ([
  "*",
  // "id",
  // id,
  // "id"
  // age,
  // fullName,
  Team (["id"]),
  // Goal (["id", "minute"]),
  // sql<{ id: number }>`
  //   and id = ${p => p.id}
  // `,
  andName
]);

const playerRes = Player ([
  "age",
  byId,
  Team (["name"])
]);

// const concatted = playerById.concat (playerRes);


playerById ({ name: "" }, querier).then (res => console.log (res));

const simpleTag = sql<{firstNameField: string}, { id: number; first_name: string}[]>`
  select id, ${Raw (p => p.firstNameField)}
`;

const simpleTag2 = sql<{limit: number}, { last_name: string}[]>`
  , last_name
  from player
  limit ${p => p.limit}
`;

const combined = simpleTag.concat (simpleTag2);

// console.log (SQLTag2.prototype);


combined ({ firstNameField: "first_name", limit: 2 }, querier).then (res => console.log (res));