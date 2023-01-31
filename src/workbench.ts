import { Pool } from "pg";
import { belongsTo, belongsToMany, hasMany, hasOne, When } from "./nodes";
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
const taggie = player<{id: number}, Player[]>`
  id
  last_name
  // ${team}
  ${byId}
  ${When (p => p.id === 400, sql<{id: number}, any>`
    order by id
  `)}
`;

// const buh = taggie.concat (player`first_name`).map (res => res[0]).map (res => {
//   console.log (res);
//   return res.id;
// });

const buh = taggie.concat (player`first_name`).map (res => res[0]).map (res => {
  console.log (res);
  return res;
}).contramap (p => ({ id: p.id * 2 })).contramap (p => ({ id: p.id * 2 }));


player<{}, Player[]>`id`.concat (player`first_name`) (querier, {}).then (([first]) => { console.log (first); });



// map(x => x) in parser
// object.assign((qurier), {})
// unknown weghalen ? defaults ?
// querier en params omwisselen
