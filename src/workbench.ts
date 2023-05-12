import { Pool } from "pg";
import { Querier } from "./common/types";
import { when } from "./common/When";
import { convertSQLTagResult } from "./SQLTag";
import sql from "./SQLTag/sql";
import Table from "./Table";
import belongsTo from "./Table/belongsTo";
import belongsToMany from "./Table/belongsToMany";
import dateProp from "./Table/dateProp";
import hasMany from "./Table/hasMany";
import hasOne from "./Table/hasOne";
import numberProp from "./Table/numberProp";
import stringProp from "./Table/stringProp";
import { Game, League, Player, Rating, Team } from "./test/tables";


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

const whenie = when<{ query: string }> (p => p.query != null) (sql`and last_name = '${p => p.query}'`);

const { id, fullName } = Player.props;

// id

const tag = Player ([
  "*",
  Team (["*"]),
  fullName.eq<{fullName: string}> (p => p.fullName)
]);


// eq ("id");
tag ({ fullName: "Gussie Dainelli", delimiter: " " }, querier).then (res => console.log (res));

// const simpleTag = sql<{firstNameField: string}, { id: number; first_name: string}[]>`
//   select id, ${Raw (p => p.firstNameField)}
// `;

// const simpleTag2 = sql<{limit: number}, { last_name: string}[]>`
//   , last_name
//   from player
//   limit ${p => p.limit}
// `;

// const combined = simpleTag.concat (simpleTag2);


// // combined.co




// combined ({ firstNameField: "first_name", limit: 2 }, querier).fork (console.log, console.log);
