import { Pool } from "pg";
import {
  BelongsTo, NumberProp, setDefaultQuerier, StringProp, Table
} from ".";

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};

setDefaultQuerier (querier);


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

// query composition
const playerById = Player ([
  id,
  "firstName",
  "lastName",
  Team ([
    id,
    "name"
  ]),
  id.eq<{ id: number }> (p => p.id)
]);

playerById ({ id: 9 }).then (console.log);