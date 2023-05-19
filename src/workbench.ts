import { Pool } from "pg";
import BelongsTo from "./Prop/BelongsTo";
import NumberProp from "./Prop/NumberProp";
import StringProp from "./Prop/StringProp";
import sql from "./SQLTag/sql";
import Table from "./Table";
import Limit from "./Table/Limit";
import Offset from "./Table/Offset";

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

const lim = Limit ("playerLimit");
type limParams = typeof lim.params;

// composition
const playerById = Player ([
  "id",
  "firstName",
  "lastName",
  Team ([
    "id",
    "name"
  ]),
  // id.eq<{ id: number }> (p => p.id),
  lim,
  Offset ()
]);

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};

playerById ({ playerLimit: 1, offset: 10 }, querier).then (res => console.log (res));
