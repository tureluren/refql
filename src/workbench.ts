import { Pool } from "pg";
import { InputSpec, OnlyFields, Spec } from "./common/types2";
import Table from "./Table";
import Table2 from "./Table2";
import belongsTo from "./Table2/belongsTo";
import Field from "./Table2/Field";
import hasMany from "./Table2/hasMany";
import numberField from "./Table2/NumberField";
import varchar from "./Table2/varchar";


const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};


interface Identifier {
  name: string;
  as: string;
}

const Player = Table2 ("player", {
  id: numberField ("id"),
  // ids: "foemp",
  firstName: varchar ("first_name"),
  team: belongsTo ("team"),
  goals: hasMany ("goal")
});

const Team = Table2 ("team", {
  id: numberField ("id"),
  // ids: "foemp",
  name: varchar ("name"),
  league: belongsTo ("league")
});

const League = Table2 ("league", {
  id: numberField ("id"),
  // ids: "foemp",
  leagueName: varchar ("name")
});

const Goal = Table2 ("goal", {
  id: numberField ("id"),
  minute: varchar ("minute")
});

const uuid = numberField ("uuid") ("uuiid");

const lastName = Field<"lastName", "last_name", string> ("lastName", "last_name");

const { firstName, team } = Player.spec;

const playerById = Player ([
  "id",
  "firstName"
]);


playerById ({}, querier).then (res => console.log (res));