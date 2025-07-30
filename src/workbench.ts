import { Pool } from "pg";
import RefQL, { isRQLTag, Limit, NumberProp, Offset, Raw, RQLTag, SQLTag, StringProp, Values } from ".";
import { Selectable } from "./common/types";

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

const { Team, Player, Goal } = tables.public;


const { teamId, firstName, lastName, id } = Player.props;

const fullName = StringProp ("fullName", sql<{ delimiter: string }>`
  concat (player.last_name, ${Raw (p => `'${p.delimiter}'`)}, player.first_name)
  `);


const logic = Player ([
  firstName.iLike ("a%").and (fullName.iLike (p => p.delimiter)),
  Limit (2)
]);

logic ({ delimiter: " " }).then (res => console.log (res));