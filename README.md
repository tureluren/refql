# RefQL
A typesafe Node.js and Deno ORM-like library for composing and running SQL queries.

## Installation
```bash
yarn install refql
# or
npm install refql 
```

## Getting started
```ts
import { Pool } from "pg";
import { sql, Table } from "refql";

// Table
const Player = Table ("player", [
  belongsTo ("team")
]);

const Team = Table ("team");

// sql snippet
const byId = sql<{id: number}>`
  and id = ${p => p.id}
`;

// composition
const playerById = Player`
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

playerById ({ id: 1 }, querier).then(console.log);

//  [
//    {
//      id: 1,
//      first_name: 'David',
//      last_name: 'Roche',
//      team: { id: 1, name: 'FC Wezivduk', league_id: 1 }
//    }
//  ]
```

## Table of contents
* [Tables and Relationships](#tables-and-relationship)
* [Fantasy Land Interoperability](#fantasy-land-Interoperability)
* [Querier](#querier)
* [Other Features](#other-features)

## Tables and Relationships
The example below shows how to define tables and their relationships with other tables. From then on, these relationships can be referenced in a `RQLTag`. Relationships are created by passing the table name as a string instead of passing a table object. This is to avoid circular dependency problems. Tables are uniquely identifiable by the combination schema and table (<schema>.<tableName>).

```ts
import { Pool } from "pg";
import { sql, Table } from "refql";

const pool = new Pool ({
  // ...pool options
});

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

const Player = Table ("player", [
  belongsTo ("public.team"),
  hasMany ("goal"),
  hasOne ("rating"),
  belongsToMany ("game")
], querier); // You can pass a default querier here

const Team = Table ("public.team");
const Goal = Table ("goal");
const Rating = Table ("rating");
const Game = Table ("game");

// SQLTag
const limit = sql<{ limit: number }>`
  limit ${p => p.limit}
`;

// RQLTag
const fullPlayer = Player`
  ${Team}
  ${Goal}
  ${Rating}
  ${Game}
  ${limit}
`;

fullPlayer ({ limit: 1 }).then(console.log);

// [
//   {
//     id: 1,
//     first_name: "Steve",
//     last_name: "Short",
//     cars: null,
//     birthday: "1995-05-05T22:00:00.000Z",
//     team_id: 1,
//     position_id: 1,
//     team: {
//       id: 1,
//       name: "FC Adunupmev",
//       league_id: 1
//     },
//     goals: [],
//     rating: {
//       player_id: 1,
//       acceleration: 9,
//       finishing: 11,
//       positioning: 56,
//       shot_power: 56,
//       free_kick: 70,
//       stamina: 88,
//       dribbling: 52,
//       tackling: 21
//     },
//     games: [
//       {
//         id: 1,
//         home_team_id: 1,
//         away_team_id: 2,
//         league_id: 1,
//         result: "5 - 2"
//       },
//       {
//         id: 2,
//         home_team_id: 1,
//         away_team_id: 3,
//         league_id: 1,
//         result: "0 - 3"
//       },
//       {
//         id: 3,
//         home_team_id: 1,
//         away_team_id: 4,
//         league_id: 1,
//         result: "4 - 2"
//       },
//       ...
//     ]
//   }
// ];
```

## Fantasy Land Interoperability
<a href="https://github.com/fantasyland/fantasy-land"><img width="82" height="82" alt="Fantasy Land" src="https://raw.github.com/puffnfresh/fantasy-land/master/logo.png"></a>

Both `RQLTag` and `SQLTag` are `Semigroup`, `Monoid`, `Functor`, `Contravariant` and `Profunctor` structures.

```ts
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

// Semigroup 
const playerById = idAndFirstName
  .concat (lastNameAndTeam);

// Contravariant & Functor
const secondPlayer = playerById
  .contramap (p => ({ id: p.id + 1 }))
  .map (players => players[0]);

secondPlayer ({ id: 1 }).then (console.log);

// {
//   id: 2,
//   first_name: 'Victor',
//   last_name: 'Owens',
//   team: { name: 'FC Adunupmev' }
// }
```

## functions, subselects, alias, converts, :1, *
## Other Features

### Raw
### Value
### Values
### Values2D
### When
`When` takes a predicate and a `SQLTag`. If the predicate returns true, the tag is added to `playerPage`.
```ts
const playerPage = Player<{ limit?: number; offset?: number }>`
  id
  first_name
  ${When (p => p.limit != null, sql`
    limit ${p => p.limit} 
  `)}
  ${When (p => p.offset != null, sql`
    offset ${p => p.offset} 
  `)}
`;

playerPage ({ limit: 5, offset: 5 }).then (console.log);
```

### Comments
Just use `//` to comment out a line.

```ts
const playerById = Player`
  id
  // first_name
  // last_name
  concat: full_name(first_name, ' ', last_name)
  ${sql`
    and id = 1 
  `}
`;

playerById ({ id: 1 }).then (console.log);

// [ { id: 1, full_name: 'Steve Short' } ]
```
### createSQLWithDefaultQuerier
### createTableWithDefaultQuerier