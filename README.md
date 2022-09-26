# RefQL
A Node.js library for composing and running SQL queries.

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

const player = sql`
  select id, first_name, last_name
  from player
`;

const byId = sql<{id: number}>`
  where id = ${p => p.id}
`;

const getPlayerById =
  player.concat (byId);

const pool = new Pool ({
  // ...pool options
});

// query: select id, first_name, last_name from player where id = $1
// values: [1]
const querier = <T>(query: string, values: any[]) => {
  return pool.query (query, values).then (({ rows }) => rows as T[]);
};

getPlayerById.run (querier, { id: 1 }).then (console.log);
// [{ id: 1, first_name: 'Estelle', last_name: 'Vangelisti' }]

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

alternative.run (querier, { id: 1 }).then (console.log);
// [{ id: 1, first_name: 'Estelle', last_name: 'Vangelisti', team: { name: 'FC Mezujfo' }}]
```
-- composition by placeholders, table, rql tags, Raw
-- composition by pipe
-- all
-- interopability
## Table of contents
* [Querier](#querier)
* [Fantasy Land](#fantasy-land)
* [Raw](#raw)
* [In](#in)
* [RQLTag](#rqltag)
* [Keywords](#keywords)
* [Subselects](#subselects)
* [SQLTag](#sqltag)
* [Aliases](#aliases)
* [Casts](#casts)
* [Functions](#functions)
* [Table](#table)
* [Literals](#literals)
* [Combining query components](#combining-query-components)

## Querier
The querier should be passed as the first argument to the `run` function. It should have the type signature `<T>(query: string, values: any[]) => Promise<T[]>`. This function is a necessary in-between piece to make RefQL independent from database clients. This allows you to choose your own client.

```ts
import mySQL from "mysql2";

const mySqlPool = mySQL.createPool ({
  // ...pool options
});

const mySQLQuerier = <T>(query: string, values: any[]): Promise<T[]> =>
  new Promise ((res, rej) => {
    pool.query (query.replace (/\$\d/g, "?"), values, (error, rows) => {
      if (error) {
        rej (error);
        return;
      }
      res (rows as T[]);
    });
  });

sql`select * from player`.run (mySQLQuerier);
```

## Fantasy Land
SQLTag implements 3 algebraic structures specified by Fantasy Land: Semigroup, Functor and Bifunctor.

### Semigroup
Compliant implementation of `fantasy-land/concat`.

```ts
const player = sql`
  select id, first_name, last_name
  from player
`;

const paginate = sql<{limit: number; offset: number}>`
  limit ${p => p.limit}
  offset ${p => p.offset}
`;

const getPlayerPage =
  // or player.concat (paginate)
  player["fantasy-land/concat"] (paginate);

getPlayerPage.run (querier, { limit: 3, offset: 5 }).then (console.log);
// [
//   { id: 6, first_name: 'Nicholas', last_name: 'Ortiz' },
//   { id: 7, first_name: 'Leila', last_name: 'Leclerc' },
//   { id: 8, first_name: 'David', last_name: 'Sassi' }
// ]
```

### Functor
Compliant implementation of `fantasy-land/map`.

```ts
const player = sql`
  select id, first_name, last_name
  from player
  limit ${2}
`;

const increment = (values: any[]) =>
  values.map (x => x + 1);

const threeInsteadOfTwo =
  // or player.map (increment)
  player["fantasy-land/map"] (increment);

threeInsteadOfTwo.run (querier).then (console.log);

// [
//   { id: 1, first_name: 'Tom', last_name: 'Cecchini' },
//   { id: 2, first_name: 'Birdie', last_name: 'Schultz' },
//   { id: 3, first_name: 'Aaron', last_name: 'Scheffer' }
// ]
```

### Bifunctor
Compliant implementation of `fantasy-land/bimap`.

## Raw
With the Raw data type it is possible to inject values as raw text into the query.

```ts
import { Raw, sql } from "refql";

// dynamic properties
const idField = "id";
const bdField = "birthday";

const getPlayerById = sql<{ id: number }>`
  select id, last_name, age (${Raw (bdField)})::text
  from player where ${Raw (idField)} = ${p => p.id}
`;

// query: select id, last_name, age (birthday)::text from player where id = $1
// values: [1]

getPlayerById.run (querier, { id: 1 }).then (console.log);
// [ { id: 1, last_name: 'Cecchini', age: '30 years 4 mons 14 days' } ]
```

## In

```ts
import { In, sql } from "refql";

const getFirstThree = sql`
  select id, last_name from player
  where id ${In ([1, 2, 3])}
`;

// query: select id, last_name from player where id in ($1,$2,$3)
// Values: [1, 2, 3]

getFirstThree.run (querier).then (console.log);
// [
//   { id: 1, last_name: 'Cecchini' },
//   { id: 2, last_name: 'Schultz' },
//   { id: 3, last_name: 'Scheffer' }
// ]
```

## RQLTag
To include referenced data and end up with an aggregated result without having to write joins.

### belongs to
Useful when you're dealing with a `n:1` relationship. The symbol for this type is a dash sign `-`.

```ts
const getPlayerById = rql<{ id: number }>`
  player (id: ${p => p.id}) {
    id
    last_name
    - team {
      id
      name
    }
  }
`;

getPlayerById.run (querier, { id: 1 }).then (console.log);
// [{ id: 1, last_name: 'Cecchini', team: { id: 1, name: 'FC Ocvila' } }]
```
### has many
Useful when you're dealing with a `1:n` relationship. The symbol for this type is a less-than sign `<`.

```ts
const getTeamById = rql<{ id: number }>`
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

getTeamById.run (querier, { id: 1 }).then (console.log);

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

### many to many
Useful when you're dealing with a `n:m` relationship and a junction table like *player_game*. The symbol for this type is the letter x sign `x`.

```ts
const getPlayerById = rql<{ id: number }>`
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

getPlayerById.run (querier, { id: 1 }).then (console.log);
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

## RQLTag Keywords
Keywords can be passed as arguments after a table declaration or by interpolating an object.

```ts
interface Keywords {
  xtable?: string;
  lref?: string;
  rref?: string;
  lxref?: string;
  rxref?: string;
  id?: number | string;
  limit?: number;
  offset?: number;
}

const players = await query<Player> (rql`
  player (offset: 0, limit: 3) {
    id
    firstName
    lastName
    - team (${{ as: "squad" }}) {
      id
      name
    }
  }
`);

// [
//   {
//     id: 1,
//     firstName: "Mark",
//     lastName: "Rosi",
//     squad: { id: 1, name: "FC Ropgomut" }
//   },
//   {
//     id: 2,
//     firstName: "Alejandro",
//     lastName: "Ye",
//     squad: { id: 1, name: "FC Ropgomut" }
//   },
//   {
//     id: 3,
//     firstName: "Chad",
//     lastName: "Bertrand",
//     squad: { id: 1, name: "FC Ropgomut" }
//   }
// ]
```

### as (String)
To rename a referenced table name. Note that `as` takes precedence over automatically generated plurals.

```ts
const players = await query<Player> (rql`
  player (id: 1) {
    id
    firstName
    lastName
    - team (${{ as: "squad" }}) {
      id
      name
    }
  }
`);

const alternative1 = await query<Player> (rql`
  player (id: 1) {
    id
    firstName
    lastName
    - team (as: "squad") {
      id
      name
    }
  }
`);

const alternative2 = await query<Player> (rql`
  player (id: 1) {
    id
    firstName
    lastName
    - team: squad {
      id
      name
    }
  }
`);

// { id: 1, lastName: "Buckley", squad: { id: 1, name: "FC Wuharazi" } }
```

### limit and offset (Number)
To limit the number of rows returned and skip rows, ideal for paging. 

```ts
const players = await query<Player> (rql`
  player (limit: 3, offset: 0) {
    id
    firstName
    lastName
  }
`);
// [
//   {
//     id: 1,
//     firstName: "Mark",
//     lastName: "Rosi"
//   },
//   {
//     id: 2,
//     firstName: "Alejandro",
//     lastName: "Ye"
//   },
//   {
//     id: 3,
//     firstName: "Chad",
//     lastName: "Bertrand"
//   }
// ]
```

### id (Number|String) (root only!)
To easily retrieve a row by its id.

```ts
const player = await query1<Player> (rql`
  player (id: 1) {
    id
    firstName
    lastName
  }
`);

const byId = id => (t: Table) => sql`
  where ${t}.id = ${id}
`;

const alternative = await query1<Player> (rql`
  player {
    id
    firstName
    lastName
    ${byId (1)}
  }
`);

// { id: 1, firstName: "Mike", lastName: "Buckley" }

```

### xTable (String) 
To provide your own junction table name (*my_games*) when the name is not a combination of the two tables involved (*player_game*).

```ts
player (id: 1) {
  id
  firstName
  lastName
  x game (xTable: "my_games") {
    id
    result
  }
}

// {
//   id: 1,
//   firstName: "Mark",
//   lastName: "Rosi",
//   games: [
//     { id: 1, result: "2 - 4" },
//     { id: 2, result: "5 - 1" },
//     { id: 3, result: "2 - 2" },
//     ...
//   ]
// }
```

### links ([["tableFromCol", "tableToCol"]])
To provide your own links between two tables. Links are a list of column pairs that are referenced with each other. These are usually detected if the database model is logically constructed and when `detectRefs = true`, or even guessed when `detectRefs = false`.

```ts
player (id: 1) {
  id
  lastName
  - team (${{ links: [["teamId", "id"]] }}) {
    id
    name
  }
}

// { id: 1, lastName: "Buckley", team: { id: 1, name: "FC Wuharazi" } }
```

### refs ({ table1: [["xTableFromCol", "table1ToCol"]], table2: [["xTableFromCol", "table2ToCol"]] })
To provide your own refs beteen the junction table and the two involved tables.

```ts
player (id: 1) {
  id
  firstName
  lastName
  x game (refs: ${{ player: [["playerId", "id"]], game: [["gameId", "id"]] }}) {
    id
    result
  }
}

// {
//   id: 1,
//   firstName: "Mark",
//   lastName: "Rosi",
//   games: [
//     { id: 1, result: "2 - 4" },
//     { id: 2, result: "5 - 1" },
//     { id: 3, result: "2 - 2" },
//     ...
//   ]
// }
```

### orderBy (SQLTag | ((t: Table) => SQLTag))
To sort [has many](#has-many) and [many to many](#many-to-many) relationships. RefQL uses the [json_agg](https://www.postgresql.org/docs/9.5/functions-aggregate.html) function where the *order_by_clause* is one of the arguments. It is separate from the rest of the query, which is why the desicision was made that it should be passed as a keyword.

```ts
team (id: 1) {
  id
  name
  < player (${{ orderBy: t => sql`order by ${t}.last_name` }}) {
    id
    lastName
  }
}

// players are sorted by lastName:

// {
//   id: 4,
//   name: "FC Foacebe",
//   players: [
//     { id: 11, lastName: "Andrei" },
//     { id: 6, lastName: "Bernardi" },
//     { id: 8, lastName: "Cook" },
//     ...
//   ]
// }
```

## Subselects
To include a nested select expression. A subselect must be a SQLTag since RQLTags can't be nested. The symbol for a subselect is a an ampersand sign `&`.

```ts
const subselect = t => sql`
  select count (*) 
  from goal
  where player_id = ${t}.id
`;

const player = await query1<Player> (rql`
  player (id: 9) {
    id
    firstName
    lastName
    & goalCount ${subselect}
  }
`);

// { id: 9, firstName: "Brent", lastName: "Richardson", goalCount: 8 }
```

## Aliases
Column names and function names can be aliased by placing 1 colon `:` after the name followed by the alias.

```ts
const player = await query1<Player> (rql`
  player (id: 1) {
    id: identifier
    concat: fullName (lastName, ' ', firstName)
  }
`);

// { identifier: 1, fullName: "Nieuwenhuis Noah" }
```

## Casts
Column names, function names and variables can be cast to another type by placing 2 colons `::` after the name, or if you are already using an alias then you must place them after the alias.

```ts
const player = await query1<Player> (rql`
  player (id: 1) {
    id::text
    substring: birthYear::int (birthday::text, 0, ${"5"}::int)
  }
`);

// { id: "1", birthYear: 1991 }
```

## SQLTag
When you encounter something more complex that you can't solve with the RQLTag or if you like writing sql, you can always fall back on the SQLTag using the tag function ` sql`` `.

## Functions
Running functions is not difficult at all and the example below is quite self-explanatory.

```ts
const positionSnippet = t =>
  sql`(select name from position where id = ${t}.position_id)`;

const player = await query1<Player> (rql`
  player (id: 1) {
    id
    datePart: age ("year", age (birthday))
    concat: fullNameAndPosition (upper (firstName), " ", upper (lower (lastName)), ", ", ${positionSnippet})
  }
`);

// { id: 1, age: 30, fullNameAndPosition: "NOAH NIEUWENHUIS, Goalkeeper" }
```


## Table
The type Table represents the current table you are working on. It is passed to a function that returns an SQLTag. This gives you the table in closure and allows you to use it as an alias in the SQLTag. 

```ts
const player = await query1<Player> (rql`
  player {
    id
    lastName
    ${(t: Table) => sql`
      where ${t}.id = 1 
    `}
  }
`);

// { id: 1, lastName: "Nieuwenhuis" }
```

## Literals
The following literals are supported: Boolean, String, Number, and Null.

```ts
const player = await query1<Player> (rql`
  player (id: 1) {
    "age": numberOfYears
    concat: literals(true, "_", false, "_", 5)
    null: nothing
    true: correct
    false
  }
`);

// {
//   numberOfYears: "age",
//   literals: "t_f_5",
//   nothing: null,
//   correct: true,
//   false: false
// }
```

## Combining query components
RefQL provides a number of helper functions to combine independent query components with each other. Note that the first component always needs to be a RQLTag or a SQLTag.

```ts
import { 
  belongsTo, hasMany, manyToMany,
  raw, rql, sql, tag, subselect
} from "refql";

const paginate = (offset, limit) => sql`
  offset ${offset}
  limit ${limit}
`;

const getPlayers = rql`
  player { id last_name }
`;

const getTeams = rql`
  team { id name }
`;

const getGames = rql`
  game { id result }
`;

const getGoalCount = t => sql`
  select count (*) from "goal"
  where "goal".player_id = ${t}.id
`;

const getTeamWithPlayers = tag (
  getTeams,
  hasMany (getPlayers)
);

const getPlayersWithTeam = tag (
  getPlayers,
  raw (`'birthday', "player".birthday`),
  subselect ("goals", getGoalCount),
  belongsTo (getTeamWithPlayers)
);

const byTeamId = teamId => t => sql`
  where ${t}.team_id = ${teamId}
`;

// `query` and `query1` use `tag` in the background
const players = await query<Player> (
  getPlayersWithTeam,
  byTeamId (1),
  paginate (0, 30),
  manyToMany (getGames)
);

// [
//   {
//     id: 1,
//     lastName: "Shibata",
//     birthday: "2002-09-18",
//     goals: 0,
//     team: {
//       id: 1,
//       name: "FC Nuvborajo",
//       players: [{ id:1, lastName: "Shibata" }, ...]
//     },
//     games: [
//       { id: 1, result: "3 - 4" },
//       { id: 2, result: "2 - 0" },
//       { id: 3, result: "0 - 1" },
//       ...
//     ]
//   },
//   {
//     id: 2,
//     lastName: "Waters",
//     birthday: "1999-07-16",
//     goals: 0,
//     team: {
//       id: 1,
//       name: "FC Nuvborajo",
//       players: [{ id:1, lastName: "Shibata" }, ...]
//     },
//     games: [
//       { id: 1, result: "3 - 4" },
//       { id: 2, result: "2 - 0" },
//       { id: 3, result: "0 - 1" },
//       ...
//     ]
//   },
//   {
//     id: 3,
//     lastName: "Fleming",
//     birthday: "1999-06-12",
//     goals: 3,
//     team: {
//       id: 1,
//       name: "FC Nuvborajo",
//       players: [{ id:1, lastName: "Shibata" }, ...]
//     },
//     games: [
//       { id: 1, result: "3 - 4" },
//       { id: 2, result: "2 - 0" },
//       { id: 3, result: "0 - 1" },
//       ...
//     ]
//   },
//   ...
// ];
```