import { Pool } from "pg";
import {
  BelongsTo, BelongsToMany, HasMany,
  HasOne, Limit, NumberProp, Offset,
  Querier,
  setConvertPromise,
  setDefaultQuerier,
  sql,
  StringProp, Table
} from ".";

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};

// setDefaultQuerier (querier);

const Player = Table ("player", [
  NumberProp ("id"),
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  BelongsTo ("team", "public.team"),
  HasOne ("rating", "rating"),
  HasMany ("goals", "goal"),
  BelongsToMany ("games", "game")
]);

const Team = Table ("public.team", [
  StringProp ("name")
]);

const Rating = Table ("rating", [
  NumberProp ("finishing"),
  NumberProp ("dribbling"),
  NumberProp ("tackling")
]);

const Game = Table ("game", [
  StringProp ("result")
]);

const Goal = Table ("goal", [
  NumberProp ("minute")
]);

const id = NumberProp ("id");

const firstTeam = Player ([
  id,
  "firstName",
  "lastName",
  Limit (),
  id.asc ()
]);



const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});


// firstTeam ({ limit: 11 }).fork (console.log, console.log);

// const playerBelongsToManyGames = BelongsToMany ("games", "game", {
//   lRef: "id",
//   rRef: "id",
//   lxRef: "player_id",
//   rxRef: "game_id",
//   xTable: "game_player"
// });
