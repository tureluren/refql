import { Pool } from "pg";
import When from "./common/When";
import BelongsTo from "./Prop/BelongsTo";
import NumberProp from "./Prop/NumberProp";
import StringProp from "./Prop/StringProp";
import Raw from "./SQLTag/Raw";
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
  BelongsTo ("team", "team"),
  StringProp ("fullName", sql<{ delimiter: string }>`
    concat (player.first_name, ${Raw (p => `'${p.delimiter}'`)}, player.last_name)
  `)
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
  "fullName",
  Team ([
    "id",
    "name"
  ]),
  // id.eq<{ id: number }> (p => p.id),
  lim,
  Offset (),
  When (p => p.q != null, sql<{q: string}>``)
]);

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};

playerById ({ playerLimit: 1, offset: 10, q: "" }, querier).then (res => console.log (res));
