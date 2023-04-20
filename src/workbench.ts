import { Pool } from "pg";
import sql from "./SQLTag2/sql";
import Table2 from "./Table2";
import belongsTo from "./Table2/belongsTo";
import Field from "./Table2/Field";
import hasMany from "./Table2/hasMany";
import numberField from "./Table2/numberField";
import varchar from "./Table2/varchar";


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



const Player = Table2 ("player", [
  numberField ("id").arrayOf (),
  numberField ("age", "age"),
  // ids: "foemp",
  // firstName: varchar ("first_name"),
  belongsTo ("team", "team"),
  hasMany ("goals", "goal")
]);

const Team = Table2 ("team", [
  numberField ("id", "id"),
  varchar ("name", "name"),
  belongsTo ("league", "league")
]);

const League = Table2 ("league", [
  numberField ("id", "id")
  // ids: "foemp",
  // leagueName: varchar ("name")
]);

const Goal = Table2 ("goal", [
  numberField ("id", "id"),
  varchar ("minute", "minute")
]);

// const uuid = numberField ("uuid") ("uuiid");

const lastName = Field<"lastName", string> ("lastName", "last_name");

const { team, id, age } = Player.spec;

const byId = sql<{ id: number }, typeof Player>`
  and id = ${p => p.id}
`;

const andName = sql<{ name: string }>`
  and name = ${p => p.name}
`;

const playerById = Player ([
  "id",
  // id,
  // "firstName"
  age,
  Team (["id"]),
  Goal (["id", "minute"]),
  sql<{ id: number }>`
    and id = ${p => p.id}
  `,
  andName
]);


playerById ({ id: 1, name: "dd" }, querier).then (res => console.log (res));
