# RefQL
A Node.js and Deno library for composing and running SQL queries.
> Inspired by [Cuery](https://github.com/Schniz/cuery) and [FxSQL](https://github.com/marpple/FxSQL)

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

const playerQuery = sql`
  select id, first_name, last_name
  from player
`;

const byId = sql<{id: number}>`
  where id = ${p => p.id}
`;

const playerById =
  playerQuery.concat (byId);

const pool = new Pool ({
  // ...pool options
});

// query: select id, first_name, last_name from player where id = $1
// values: [1]
const querier = (query: string, values: any[]) =>
  pool.query (query, values).then (({ rows }) => rows);

playerById.run<Player> (querier, { id: 1 }).then (console.log);

// [ { id: 1, first_name: 'Estelle', last_name: 'Vangelisti' } ]

// alternative (including team)
const alternative = rql<{id: number}>`
  player (id: ${p => p.id}) {
    id
    first_name
    last_name
    - team {
      name
    }
  }
`;

alternative.run<Player> (querier, { id: 1 }).then (console.log);

// [ { id: 1, first_name: 'Estelle', last_name: 'Vangelisti', team: { name: 'FC Mezujfo' } } ]
```

## Table of contents
* [Querier](#querier)
* [Composition by Fantasy Land](#composition-by-fantasy-land)
* [Composition by placeholders](#composition-by-placeholders)
* [Raw](#raw)
* [In](#in)
* [Table](#table)
* [RQLTag](#rqltag)
* [Function placeholder](#function-placeholder)

## Querier
The querier should be passed as the first argument to the `run` function. It should have the type signature `<T>(query: string, values: any[]) => Promise<T[]>`. This function is a necessary in-between piece to make RefQL independent from database clients. This allows you to choose your own client.

```ts
import mySQL from "mysql2";

const mySqlPool = mySQL.createPool ({
  // ...pool options
});

const mySQLQuerier = (query: string, values: any[]) =>
  new Promise ((res, rej) => {
    pool.query (query.replace (/\$\d/g, "?"), values, (error, rows) => {
      if (error) {
        rej (error);
        return;
      }
      res (rows);
    });
  });

sql`select * from player`.run<Player> (mySQLQuerier, {});
```

## Composition by Fantasy Land
<a href="https://github.com/fantasyland/fantasy-land"><img width="82" height="82" alt="Fantasy Land" src="https://raw.github.com/puffnfresh/fantasy-land/master/logo.png"></a>

SQLTag implements 2 algebraic structures specified by Fantasy Land: Semigroup, Functor.

### Semigroup
Compliant implementation of `fantasy-land/concat`.

```ts
const playerQuery = sql`
  select id, first_name, last_name
  from player
`;

const paginate = sql<{limit: number; offset: number}>`
  limit ${p => p.limit}
  offset ${p => p.offset}
`;

const playerPage =
  // or player.concat (paginate)
  playerQuery["fantasy-land/concat"] (paginate);

playerPage.run<Player> (querier, { limit: 3, offset: 5 }).then (console.log);

// [
//   { id: 6, first_name: 'Nicholas', last_name: 'Ortiz' },
//   { id: 7, first_name: 'Leila', last_name: 'Leclerc' },
//   { id: 8, first_name: 'David', last_name: 'Sassi' }
// ]
```

### Functor
Compliant implementation of `fantasy-land/map`.

```ts
const playerQuery = sql`
  select id, first_name, last_name
  from player
`;

const orderByLastName = (values: any[]) =>
  values.concat ("order by last_name limit 2");

const orderedPlayers =
  // or player.map (orderByLastName)
  playerQuery["fantasy-land/map"] (orderByLastName);

orderedPlayers.run<Player> (querier, {}).then (console.log);

// [
//   { id: 326, first_name: 'Lucy', last_name: 'Acciai' },
//   { id: 6, first_name: 'Katie', last_name: 'Adam' }
// ]
```
## Composition by placeholders

```ts
const paginate = sql<{limit: number; offset: number}>`
  limit ${p => p.limit}
  offset ${p => p.offset}
`;

const orderByLastName = sql`
  select id, first_name, last_name
  from player
  ${sql`order by last_name`}
  ${paginate}
`;

orderByLastName.run<Player> (querier, { limit: 2, offset: 5 }).then (console.log);

// [
//   { id: 368, first_name: 'Fanny', last_name: 'Aguilar' },
//   { id: 508, first_name: 'Ruth', last_name: 'Albers' }
// ]
```

## Raw
With the Raw data type it's possible to inject values as raw text into the query.

```ts
import { Raw, sql } from "refql";

// dynamic properties
const idField = "id";
const bdField = "birthday";

const playerById = sql<{ id: number }>`
  select id, last_name, age (${Raw (bdField)})::text
  from player where ${Raw (idField)} = ${p => p.id}
`;

// query: select id, last_name, age (birthday)::text from player where id = $1
// values: [1]

playerById.run<Player> (querier, { id: 1 }).then (console.log);

// [ { id: 1, last_name: 'Cecchini', age: '30 years 4 mons 14 days' } ]
```

## In

```ts
import { In, sql } from "refql";

const first3 = sql`
  select id, last_name from player
  where id ${In ([1, 2, 3])}
`;

// query: select id, last_name from player where id in ($1,$2,$3)
// values: [1, 2, 3]

first3.run<Player> (querier, {}).then (console.log);

// [
//   { id: 1, last_name: 'Cecchini' },
//   { id: 2, last_name: 'Schultz' },
//   { id: 3, last_name: 'Scheffer' }
// ]
```

## Table
Table (name, as, schema) can be used dynamically inside a SQLTag.

```ts
const select = (tableName: string, columns: string[] = []) => sql`
  select ${Raw (columns.map (c => `t.${c}`).join (", "))} from ${Table (tableName, "t", "public")}
`;

const playerQuery = select ("player", ["id", "last_name"]).concat (paginate);

// query: select t.id, t.last_name from public.player t limit $1 offset $2
// values: [2. 3]

playerQuery.run<Player> (querier, { limit: 2, offset: 3 }).then (console.log);

// [ { id: 4, last_name: 'Tapinassi' }, { id: 5, last_name: 'Freeman' } ]
```

## RQLTag
To include referenced data and end up with an aggregated result without having to write joins.

### Belongs to
Useful when you're dealing with a `n:1` relationship. The symbol for this type is a dash sign `-`.

```ts
const playerById = rql<{ id: number }>`
  player (id: ${p => p.id}) {
    id
    last_name
    - team {
      id
      name
    }
  }
`;

playerById.run<Player> (querier, { id: 1 }).then (console.log);

// [ { id: 1, last_name: 'Cecchini', team: { id: 1, name: 'FC Ocvila' } } ]
```

### Has many
Useful when you're dealing with a `1:n` relationship. The symbol for this type is a less-than sign `<`.

```ts
const teamById = rql<{ id: number }>`
  team (id: ${p => p.id}) {
    id
    name
    < player: players {
      id
      first_name
      last_name
    }
  }
`;

teamById.run<Player> (querier, { id: 1 }).then (console.log);

// {
//   id: 1,
//   name: 'FC Wuharazi',
//   players: [
//     { id: 1, first_name: 'Mike', last_name: 'Buckley' },
//     { id: 2, first_name: 'Lela', last_name: 'Morales' },
//     { id: 3, first_name: 'Delia', last_name: 'Brandt' },
//     ...
//   ]
// }

```

### Many to many
Useful when you're dealing with a `n:m` relationship and a junction table like *player_game*. The symbol for this type is the letter x sign `x`.

```ts
const playerById = rql<{ id: number }>`
  player (id: ${p => p.id}) {
    id
    first_name
    last_name
    x game: games {
      id
      result
    }
  }
`;

playerById.run<Player> (querier, { id: 1 }).then (console.log);

// {
//   id: 1,
//   first_name: 'Anne',
//   last_name: 'Herrmann',
//   games: [
//     { id: 1, result: '4 - 0' },
//     { id: 2, result: '1 - 0' },
//     { id: 3, result: '1 - 4' }
//   ]
// };
```

### RQLTag keywords
Keywords can be passed as arguments after a table declaration.

#### limit and offset (Number)
To limit the number of rows returned and skip rows, ideal for paging. 

```ts
const playerQuery = rql`
  player (limit: 3, offset: 0) {
    id
    first_name
    last_name
  }
`;

playerQuery.run<Player> (querier, {}).then (console.log);

// [
//   { id: 1, first_name: 'Logan', last_name: 'Groen' },
//   { id: 2, first_name: 'Hannah', last_name: 'Boretti' },
//   { id: 3, first_name: 'Robert', last_name: 'Da SilvaSilva' }
// ]
```

#### id (Number|String)
To easily retrieve a row by its id.

```ts
const playerById = rql<{ id: number }>`
  player (id: ${p => p.id}) {
    id
    first_name
    last_name
  }
`;

playerById.run<Player> (querier, { id: 1 }).then (console.log);

// [ { id: 1, first_name: 'Logan', last_name: 'Groen' } ]
```

#### lref and rref (comma-separated String)
To provide refs between two tables. When these aren't provided, RefQL tries to guess them.

```ts
const playerQuery = rql`
  player (id: 1) {
    id
    first_name
    last_name
    - team (lref: "team_id", rref: "id") {
      id
      name
    }
  }
`;

playerQuery.run<Player> (querier, {}).then (console.log);

// [
//   {
//     id: 1,
//     first_name: 'Logan',
//     last_name: 'Groen',
//     team: { id: 1, name: 'FC Dezrano' }
//   }
// ]

```
#### lxref, rxref (comma-separated String) and xtable (String)
To provide refs between the junction table (xtable) and the two involved tables.

```ts
const playerQuery = rql`
  player (id: 1) {
    id
    first_name
    last_name
    x game: games (
        lref: "id", lxref: "player_id",
        rref: "id", rxref: "game_id",
        xtable: "player_game"
      ) {
      id
      result
    }
  }
`;

playerQuery.run<Player> (querier, {}).then (console.log);

// {
//     id: 1,
//     first_name: 'Logan',
//     last_name: 'Groen',
//     games: [
//       { id: 1, result: '5 - 5' },
//       { id: 2, result: '1 - 4' },
//       { id: 3, result: '3 - 1' },
//       ...
//     ]
//   }
```
### All
To select all columns.

```ts
const player1 = rql`
  player (id: 1) {
    *
  }
`;

player1.run<Player> (querier, {}).then (console.log);

// [
//   {
//     id: 1,
//     first_name: 'Logan',
//     last_name: 'Groen',
//     birthday: 1989-06-26T22:00:00.000Z,
//     team_id: 1,
//     position_id: 1
//   }
// ]
```

### Aliases
Column names and function names can be aliased by placing 1 colon `:` after the name followed by the alias.

```ts
const player1 = rql`
  player (id: 1) {
    id: identifier
    concat: fullName (last_name, ' ', first_name)
  }
`;

player1.run<Player> (querier, {}).then (console.log);

// [ { identifier: 1, fullname: 'Groen Logan' } ]
```

### Casts
Column names, function names and variables can be cast to another type by placing 2 colons `::` after the name, or if you are already using an alias then you must place them after the alias.

```ts
const player1 = rql`
  player (id: 1) {
    id::text
    substring: birthYear::int (birthday::text, 0, ${"5"}::int)
  }
`;

player1.run<Player> (querier, {}).then (console.log);

// [ { id: '1', birthyear: 1989 } ]
```

### Subselects
To include a nested select expression. A subselect must be a SQLTag.

```ts
const goalCount = sql`
  select count (*) 
  from goal
  where player_id = ${(_p, t) => t}.id
`;

const player9 = rql`
  player (id: 9) {
    id
    first_name
    last_name
    ${goalCount}:goal_count::int
  }
`;

player9.run<Player> (querier, {}).then (console.log);

// [ { id: 9, first_name: 'Lydia', last_name: 'Graham', goal_count: 4 } ]
```

### Functions
Running functions is not difficult at all and the example below is quite self-explanatory.

```ts
const position =
  sql`select name from position where id = ${(_p, t) => t}.position_id`;

const player1 = rql`
  player (id: 1) {
    id
    date_part: age ("year", age (birthday))
    concat: fullNameAndPosition (upper (first_name), " ", upper (lower (last_name)), ", ", ${position})
  }
`;

player1.run<Player> (querier, {}).then (console.log);

// [ { id: 1, age: 33, fullnameandposition: 'LOGAN GROEN, Goalkeeper' } ]
```

### Literals
The following literals are supported: Boolean, String, Number, and Null.

```ts
const player1 = rql`
  player (id: 1) {
    "age": numberOfYears
    concat: literals(true, "_", false, "_", 5)
    null: nothing
    true: correct
    false
  }
`;

player1.run<Player> (querier, {}).then (console.log);

// [
//   {
//     numberofyears: 'age',
//     literals: 't_f_5',
//     nothing: null,
//     correct: true,
//     bool: false
//   }
// ]
```

### Composition by Fantasy Land
<a href="https://github.com/fantasyland/fantasy-land"><img width="82" height="82" alt="Fantasy Land" src="https://raw.github.com/puffnfresh/fantasy-land/master/logo.png"></a>

RQLTag implements only 1 algebraic structure specified by Fantasy Land: Functor. RQLTag doesn't implement `fantasy-land/concat` because the associativity law wouldn't hold.

### Functor
Compliant implementation of `fantasy-land/map`.

```ts
import { Root, rql, RQLTag, sql } from "refql";

const player9 = rql`
  player (id: 9) { * }
`;

const teamQuery = rql`
  team { * }
`;

const goalQuery = rql`
  goal { * }
`;

const belongsTo = <Params>(tag: RQLTag<Params>) => <Params2>(node: Root<Params2>) => {
  return node.addMember (tag.node.toBelongsTo ());
};

const hasMany = <Params>(tag: RQLTag<Params>, as: string) => <Params2>(node: Root<Params2>) => {
  return node.addMember (tag.node.toHasMany ().setAs (as));
};

const fullPlayer = player9
  .map (belongsTo (teamQuery))
  .map (hasMany (goalQuery, "goals"));

fullPlayer.run<Player> (querier, {}).then (console.log);

// [
//   {
//     id: 9,
//     first_name: 'Lydia',
//     last_name: 'Graham',
//     birthday: 2004-12-04T23:00:00.000Z,
//     team_id: 1,
//     position_id: 9,
//     team: { id: 1, name: 'FC Dezrano', league_id: 1 },
//     goals: [
//      { id: 23, game_id: 4, player_id: 9, own_goal: false, minute: 45 },
//      { id: 30, game_id: 5, player_id: 9, own_goal: false, minute: 43 },
//      { id: 38, game_id: 7, player_id: 9, own_goal: false, minute: 4 },
//      { id: 39, game_id: 7, player_id: 9, own_goal: false, minute: 20 }
//     ]
//   }
// ]
```

### Composition by placeholders
```ts
const teamQuery = rql`
  team { * }
`;

const goalQuery = rql`
  goal { * }
`;

const fullPlayer = rql<{ id: number }>`
  ${Table ("player")} {
    *
    - ${teamQuery}
    < ${goalQuery}:goals
    ${(p, t) => sql`
      where ${t}.id = ${p.id} 
    `}
  }
`;


fullPlayer.run<Player> (querier, { id: 9 }).then (console.log);

// [
//   {
//     id: 9,
//     first_name: 'Lydia',
//     last_name: 'Graham',
//     birthday: 2004-12-04T23:00:00.000Z,
//     team_id: 1,
//     position_id: 9,
//     team: { id: 1, name: 'FC Dezrano', league_id: 1 },
//     goals: [
//      { id: 23, game_id: 4, player_id: 9, own_goal: false, minute: 45 },
//      { id: 30, game_id: 5, player_id: 9, own_goal: false, minute: 43 },
//      { id: 38, game_id: 7, player_id: 9, own_goal: false, minute: 4 },
//      { id: 39, game_id: 7, player_id: 9, own_goal: false, minute: 20 }
//     ]
//   }
// ]
```

## Function placeholder
If you use a function placeholder inside `sql` or `rql`, the first parameter of that function will be the object that you pass as the second argument to `run`. Inside `rql`, u can also access the table that you're working on through the second parameter of the function placeholder.

```ts
const playerQuery = rql<{ limit: number }>`
  player (limit: ${p => p.limit}){
    *
    ${sql`
      order by ${(_p, t) => t}.last_name desc
    `}
  }
`;

const equivalent = rql<{ limit: number }>`
  player (limit: ${p => p.limit}){
    *
    ${(_p, t) => sql`
      order by ${t}.last_name desc
    `}
  }
`;


playerQuery.run<Player> (querier, { limit: 1 }).then (console.log);

// [
//   {
//     id: 217,
//     first_name: 'Hallie',
//     last_name: 'Zoppi',
//     birthday: 1996-09-05T22:00:00.000Z,
//     team_id: 20,
//     position_id: 8
//   }
// ]
```