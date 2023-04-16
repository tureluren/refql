import { Pool } from "pg";
import { InputSpec, OnlyFields, Spec } from "./common/types2";
import Table from "./Table";
import Table2 from "./Table2";
import arrayOf from "./Table2/arrayOf";
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
  numberField ("id", "id").arrayOf (),
  numberField ("age", "age"),
  // ids: "foemp",
  // firstName: varchar ("first_name"),
  belongsTo ("team", "team"),
  hasMany ("goal", "goal")
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

const lastName = Field<"lastName", "last_name", string> ("lastName", "last_name");

const { team, id, age } = Player.spec;

const playerById = Player ([
  "id",
  // id,
  // "firstName"
  age,
  Team (["id", League (["id"])]),
  Goal (["id", "minute"])

]);


playerById ({}, querier).then (res => console.log (res));