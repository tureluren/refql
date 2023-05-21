import { Pool } from "pg";
import BelongsTo from "./Prop/BelongsTo";
import BelongsToMany from "./Prop/BelongsToMany";
import HasMany from "./Prop/HasMany";
import HasOne from "./Prop/HasOne";
import NumberProp from "./Prop/NumberProp";
import StringProp from "./Prop/StringProp";
import Raw from "./SQLTag/Raw";
import sql from "./SQLTag/sql";
import Table from "./Table";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const id = NumberProp ("id");

const Player = Table ("player", [
  id,
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  StringProp ("fullName", sql<{ delimiter: string }>`
    concat (player.first_name, ${Raw (p => `'${p.delimiter}'`)}, player.last_name)
  `),
  BelongsTo ("team", "public.team"),
  HasOne ("rating", "rating"),
  HasMany ("goals", "goal"),
  BelongsToMany ("games", "game")
]);

const Team = Table ("public.team", [
  id,
  StringProp ("name")
]);

const Rating = Table ("rating", [
  NumberProp ("finishing"),
  NumberProp ("dribbling"),
  NumberProp ("tackling")
]);

const Game = Table ("game", [
  id,
  StringProp ("result")
]);

const Goal = Table ("goal", [
  id,
  NumberProp ("minute")
]);

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};

const fullPlayer = Player ([
  "id",
  "firstName",
  "lastName",
  id.in ([1, 2, 3]),
  Player.props.id.desc (),
  Player.props.fullName.desc ()
]);

fullPlayer ({ delimiter: " " }, querier).then (res => console.log (res));
