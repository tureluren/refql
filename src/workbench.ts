import { Pool } from "pg";
import RefQL, { Limit, NumberProp, StringProp } from ".";
import Or from "./RQLTag/Or";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 3308
});


const querier = async (query: string, values: any[]) => {
  console.log ("'" + query + "'");
  // console.log (values);
  const res = await pool.query (query, values);

  return res.rows;
};


const { tables, Table, sql } = RefQL ({
  querier
});

const { Team } = tables.public;

const { name } = Team.props;

const Player = Table ("player", [
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  NumberProp ("nummerke", sql<{ nr: number} >`1`)
]);

const { firstName, nummerke } = Player.props;


const readPlayer = Player ([
  // "nummerke",
  // nummerke,
  firstName.iLike ("A%").or (firstName.like ("B%").gt ("a")),
  Limit (1)
]);

readPlayer ().then (r => {
  console.log (r);
});


