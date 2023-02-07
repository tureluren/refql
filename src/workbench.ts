import { Pool } from "pg";
import { belongsTo, belongsToMany, hasMany, hasOne } from "./nodes";
import sql from "./SQLTag/sql";
import Table from "./Table";

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

const Player = Table ("player", [
  belongsTo ("team")
], querier);

const Team = Table ("team");

const byId = sql<{id: number}>`
  and id = ${p => p.id}
`;

const idAndFirstName = Player<{}, { id: number; first_name: string }[]>`
  id
  first_name
`;

const lastNameAndTeam = Player<{ id: number }, { last_name: string; team: { name: string } }[]>`
  last_name
  ${Team`name`}
  ${byId}
`;

// Semigroup & Monoid
const playerById = idAndFirstName
  .concat (lastNameAndTeam);

playerById.contramap (p => ({ id: p.id + 1 })).map (res => res[0]) ({ id: 1 }).then (res => console.log (res));
