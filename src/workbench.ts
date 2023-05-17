import { Pool } from "pg";
import BelongsTo from "./Prop/BelongsTo";
import NumberProp from "./Prop/NumberProp";
import StringProp from "./Prop/StringProp";
import Table from "./Table";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

// id Prop
const id = NumberProp ("id");

// Tables
const Player = Table ("player", [
  id,
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  BelongsTo ("team", "team")
]);

const Team = Table ("team", [
  id,
  StringProp ("name")
]);

// composition
const playerById = Player ([
  "id",
  "firstName",
  "lastName",
  Team ([
    "id",
    "name"
  ]),
  id.eq<{ id: number }> (p => p.id)
]);

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

playerById ({ id: 1 }, querier).then (console.log);