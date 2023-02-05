# RefQL
A Node.js and Deno ORM-like library for composing and running SQL queries.

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
const Player = Table ("player", [
  belongsTo ("team")
]);

const Team = Table ("team");

// sql snippets
const byId = sql<{id: number}>`
  and id = ${p => p.id}
`;

// composition
const playerById = Player<{id: number}, Player>`
  id
  first_name
  last_name
  ${Team}
  ${byId}
`;

const pool = new Pool ({
  // ...pool options
});

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

playerById (querier, { id: 1 });

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
* [Tables and Relationships](#querier)
* [Querier](#querier)

## Tables and Relationships
strings because of circular references
```ts
const Player = Table ("player", [
  belongsTo ("team"),
  hasMany ("goal"),
  hasOne ("rating"),
  belongsToMany ("game")
]);
```
