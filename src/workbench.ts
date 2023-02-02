import { Pool } from "pg";
import { belongsTo, belongsToMany, hasMany, hasOne, Value, When } from "./nodes";
import RQLTag from "./RQLTag";
import { Player, Team } from "./soccer";
import sql from "./SQLTag/sql";
import Table from "./Table";

const team = Table ("team", [hasMany ("player")]);
const goal = Table ("goal");
const rating = Table ("rating");
const game = Table ("game");

const player = Table ("player", [
  belongsTo ("team"),
  hasMany ("goal"),
  hasOne ("rating"),
  belongsToMany ("game")
]);

const orderr = sql<{id: number}, any>`
  ${player}
  ${p => p.id}
  order by id
`;

const byId = sql`
  ${orderr}
`;

// const tag = player<{}>`
//   ${team}
//   ${goal}
//   ${rating}
//   ${game}
//   ${byId}
// `;

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});


const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

// tag.run (querier, { id: 1 }).then (console.log);

// contramap

const player1 = player<{id: number}, { id: string; first_name: string}[]>`
  id
  first_name
`;

// const player2 = player`
//   last_name
// `;

// const player3 = player1.contramap (p => ({
//   limit: p.id
// }));

player1 ({ id: 1 }, querier);
// unknown weghalen ? defaults ?

// player3 (querier) moet zagen dat er geen params zijn indien er zoude moeten zijn;

const tagWithVal = sql<{id: number}, any>`
  ${Value (p => p.id)}
`;

// specify welke astnodes value moge zijn