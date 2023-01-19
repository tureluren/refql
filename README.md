# RefQL
A Node.js and Deno library for composing and running SQL queries.

## Installation
```bash
yarn install refql
# or
npm install refql 
```

## Getting started
```ts
import { Pool } from "pg";
import { rql, sql } from "refql";

// Table
const player = Table ("player", [
  belongsTo ("team")
]);

const team = Table ("team");

// sql snippets
const byId = sql<{id: number}>`
  and id = ${p => p.id}
`;

// composition
const playerById = player`
  id
  first_name
  last_name
  ${team}
  ${byId}
`;

const pool = new Pool ({
  // ...pool options
});

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

playerById.run<Player> (querier, { id: 1 });

// [
//   {
//     id: 1,
//     first_name: 'David',
//     last_name: 'Roche',
//     team: { id: 1, name: 'FC Wezivduk', league_id: 1 }
//   }
// ]
```

## Table of contents
* [Table](#querier)
* [Querier](#querier)

## Table
