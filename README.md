# RefQL
A Node.js library for retrieving data from a PostgreSQL database with an interesting query language included.

## Introduction
RefQL is about retrieving referenced data in an elegant, non-painful and no-nosense way (see [relationships](#Relationships)). If you are a fan of simple, traditional REST API endpoints and not of GraphQL, but you do want that GraphQL feeling when querying a database, RefQL is for you. 

> Note that for now RefQL only works with PostgreSQL. The [node-postgres](https://github.com/brianc/node-postgres) library is used to communicate with your PostgresSQL database. 

## Installation
```bash
yarn install refql
# or
npm install refql 
```

## Getting started
```ts
import { RefQL, rql, sql } from "refql";

const config = {
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
};

const { 
  query1, // get one result
  query, // get multiple results
  pool // node-postgres pool
} = RefQL (config);

async function getPlayer() {
  const player = await query1<Player> (rql`
    player (id: 1) {
      id
      lastName
      - team {
        id
        name
      }
    }
  `);

  const alternative = await query1<Player> (rql`
    player {
      id
      lastName
      - team {
        id
        name
      }
      ${t => sql`
        where ${t}.id = 1 
      `}
    }
  `);

  // { id: 1, lastName: "Buckley", team: { id: 1, name: "FC Wuharazi" } }
  console.log (player);
  // { id: 1, lastName: "Buckley", team: { id: 1, name: "FC Wuharazi" } }
  console.log (alternative);
}

getPlayer();

```
## Table of contents
* [Options](#Options)
* [Relationships](#Relationships)
* [Keywords](#Keywords)
* [Subselects](#Subselects)
* [SQLTag](#SQLTag)
* [Aliases](#Aliases)
* [Casts](#Casts)
* [Functions](#Functions)
* [Raw](#Raw)
* [Table](#Table)
* [Literals](#Literals)
* [Combining query components](#Combining-query-components)


## Options
```ts
const refQL = RefQL ({
  // ------ node-postgres config -------
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432,
  // ... other node-postgres config

  // ------ RefQL config ---------------

  // JavaScript case type
  caseTypeJS: "camel",

  // database case type
  caseTypeDB: "snake",

  // debug
  debug: (query, values, ast) => {
    console.log (query);
    console.log (values);
    console.log (ast);
  },

  // automatically detect references between tables
  detectRefs: true,

  // automatically convert keys to plural for "has many" and "many to many" relationships
  pluralize: true,

  // to provide plurals yourself
  plurals: {},

  // to provide table references yourself
  refs: {},

  // find links through aliases 
  useSmartAlias: true
});
```

### caseTypeDB option (CaseType, default `undefined`)
When defined, keys are automatically converted to the specified case type, that you use in your database, before a query is executed.

```ts

// caseTypeDB = "snake"
player (id: 1) {
  id
  firstName
  lastName
}

// Keys converted to snake case:

// select json_build_object('id', "player".id, 'firstName', "player".first_name, 'lastName', "player".last_name) from "player" "player" where "player".id = 1
```

### caseTypeJS option (CaseType, default `undefined`)
When defined, keys are automatically converted to the specified case type in which you want the results when they return from the database.

```ts

// caseTypeJS = "camel"
player (id: 1) {
  id
  first_name
  last_name
}

// Keys converted to camel case:

// { id: 1, firstName: "Mike", lastName: "Buckley" }
```

### detectRefs option (Boolean, default `true`)
When true, RefQL will run a query on the [pg_constraint](https://www.postgresql.org/docs/current/catalog-pg-constraint.html) table to find out what references there are between the tables.

### pluralize option (Boolean, default `true`)
When true, keys are automatically converted to plural for [has many](#has-many) and [many to many](#many-to-many) relationships.

```ts
team (id: 1) {
  id
  name
  < player {
    id
    firstName
    lastName
  }
}

// player records are stored in `players`:

// {
//   id: 1,
//   name: "FC Wuharazi",
//   players: [
//     { id: 1, firstName: "Mike", lastName: "Buckley" },
//     { id: 2, firstName: "Lela", lastName: "Morales" },
//     { id: 3, firstName: "Delia", lastName: "Brandt" },
//     ...
//   ]
// }

```

### plurals option (Object, default `{}`)
If you provide your own plurals in the configuration then they will be used where necessary.
The plurals object must have the singular as its key and the plural as its value.

```ts
const plurals = { player: "teammates" };

team (id: 1) {
  id
  name
  < player {
    id
    firstName
    lastName
  }
}

// player records are now stored in `teammates`:

// {
//   id: 1,
//   name: "FC Wuharazi",
//   teammates: [
//     { id: 1, firstName: "Mike", lastName: "Buckley" },
//     { id: 2, firstName: "Lela", lastName: "Morales" },
//     { id: 3, firstName: "Delia", lastName: "Brandt" },
//     ...
//   ]
// }
```

### refs option (Object, default `{}`)
If you provide your own refs in the configuration, they will be used instead of any detected refs.

```ts
// example on how the structure of refs should look like:

// { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }
const refs = {
  player: { team: [["teamId", "id"]], position: [["positionId", "id"]] },
  team: { league: [["leagueId", "id"]] }
};
```

### useSmartAlias (Boolean, default `true`)
Suppose you have a table with multiple references to another table, then smart aliases can be useful. Just define an alias that corresponds to the foreign key allowing links to be made.

```ts
const game = await query1<Game> (rql`
  game (id: 1) {
    id
    result
    - team: homeTeam {
      id
      name
    }
    - team: awayTeam {
      id
      name
    }
  }
`);

// specify links
const alternative = await query1<Game> (rql`
  game (id: 1) {
    id
    result
    - team (${{ as: "homeTeam", links: [["homeTeamId", "id"]] }}) {
      id
      name
    }
    - team: awayTeam (${{ links: [["awayTeamId", "id"]] }}) {
      id
      name
    }
  }
`);

// {
//   id: 1,
//   result: "4 - 0",
//   homeTeam: { id: 1, name: "FC Fobamitu" },
//   awayTeam: { id: 2, name: "FC Rebmeso" }
// };
```


## Relationships
This is where RefQL really shines. To include referenced data, you only need to pass a single query with relationship signs to the tag function ` rql`` ` and run it. Imagine doing this with SQL, using join clauses or running multiple queries and end up with data that isn't aggregated. With PostgreSQL you can always use the built-in JSON function [json_build_object](https://www.postgresql.org/docs/current/functions-json.html) in combination with [json_agg](https://www.postgresql.org/docs/9.5/functions-aggregate.html) to get a fully aggregated result with a single query. Though, writing these out can be very time-consuming, and you may find that they don't look so clean. Creating a query with the tag function ` rql`` ` will create a RQLTag object that will be parsed into an AST and interpreted into SQL.

> RefQL relies heavily on references. They are either [provided](#refs-option-object-default-) by you, [detected](#detectrefs-option-boolean-default-true) or guessed. These last 2 work very well when your database model is logically constructed and uses logical names for foreign keys.

### belongs to
Useful when you're dealing with a `n:1` relationship. The symbol for this type is a dash sign `-`.

```ts
const player = await query1 (rql`
  player (id: 1) {
    id
    lastName
    - team {
      id
      name
    }
  }
`);

// { id: 1, lastName: "Buckley", team: { id: 1, name: "FC Wuharazi" } }
```
### has many
Useful when you're dealing with a `1:n` relationship. The symbol for this type is a less-than sign `<`.

```ts
const team = await query1 (rql`
  team (id: 1) {
    id
    name
    < player {
      id
      firstName
      lastName
    }
  }
`);

// {
//   id: 1,
//   name: "FC Wuharazi",
//   players: [
//     { id: 1, firstName: "Mike", lastName: "Buckley" },
//     { id: 2, firstName: "Lela", lastName: "Morales" },
//     { id: 3, firstName: "Delia", lastName: "Brandt" },
//     ...
//   ]
// }

```

### many to many
Useful when you're dealing with a `n:m` relationship and a junction table like *player_game*. The symbol for this type is the letter x sign `x`.

```ts
const player = await query1 (rql`
  player (id: 1) {
    id
    firstName
    lastName
    x game {
      id
      result
      x player {
        id
        firstName
        lastName
      }
    }
  }
`);

// {
//   id: 1,
//   firstName: "Anne",
//   lastName: "Herrmann",
//   games: [
//     {
//       id: 1, result: "4 - 0",
//       players: [
//         { id: 1, firstName: "Anne", lastName: "Herrmann" },
//         { id: 2, firstName: "Joshua", lastName: "Piazza" },
//         { id: 3, firstName: "Birdie", lastName: "Perez" },
//         ...
//       ]
//     },
//     {
//       id: 2,
//       result: "1 - 0",
//       players: [
//         { id: 1, firstName: "Anne", lastName: "Herrmann" },
//         { id: 2, firstName: "Joshua", lastName: "Piazza" },
//         { id: 3, firstName: "Birdie", lastName: "Perez" },
//         ...
//       ]
//     },
//     {
//       id: 3,
//       result: "1 - 4",
//       players: [
//         { id: 1, firstName: "Anne", lastName: "Herrmann" },
//         { id: 2, firstName: "Joshua", lastName: "Piazza" },
//         { id: 3, firstName: "Birdie", lastName: "Perez" },
//         ...
//       ]
//     }
//   ]
// };
```

## Keywords
Keywords can be passed as arguments after a table declaration or by interpolating an object.

```ts
interface Keywords {
  as?: string;
  links?: Link[];
  refs?: TableRefsObject;
  xTable?: string;
  orderBy?: SQLTag | ((t: Table) => SQLTag);
  id?: number | string;
  limit?: number;
  offset?: number;
};

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

### limit and offset (Number) (root only!)
To limit the number of rows returned and skip rows, ideal for paging. Right now, this feature can only be used for the root selection (*player*) because using limit and offset in combination with PostgreSQL's JSON functions seems to be impossible. It's intended that this will be possible in the future when RefQL provides an option to not work with these built-in JSON functions.

```ts
const players = await query<Player> (rql`
  player (limit: 3, offset: 0) {
    id
    firstName
    lastName
  }
`);

const alternative = await query<Player> (rql`
  player {
    id
    firstName
    lastName
    ${sql`
      limit 3
      offset 0
    `}
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

### Select

```ts
const player = await query1<Player> (sql`
  select id, first_name, last_name
  from "player"
  where id = 1
`);

// { id: 1, firstName: "Noah", lastName: "Nieuwenhuis" }
```

### Where in

```ts
const players = await query<Player> (sql`
  select id, first_name, last_name
  from player
  where id in (${[1, 2, 3]})
`);

// [
//   { id: 1, firstName: "Blanche", lastName: "Sestini" },
//   { id: 2, firstName: "Christine", lastName: "Sims" },
//   { id: 3, firstName: "Edward", lastName: "Rodríguez" }
// ];
```

### insert into

```ts
const playerInfo = {
  firstName: "John",
  lastName: "Doe"
};

const player = await query1<Player> (sql`
  insert into player (first_name, last_name)
  values (${playerInfo.firstName}, ${playerInfo.lastName})
  returning *
`);

// { 
//   id: 666, firstName: "John", lastName: "Doe",
//   birthday: null, teamId: null, positionId: null
// }
```

### update

```ts
const updatedInfo = {
  id: 666,
  teamId: 1,
  positionId: 9,
  birthday: "1985-01-01"
};

const player = await query1<Player> (sql`
  update player
  set
    team_id = ${updatedInfo.teamId},
    position_id = ${updatedInfo.positionId},
    birthday = ${updatedInfo.birthday}
  where id = ${updatedInfo.id}
  returning *, birthday::text
`);

// {
//   id: 666, firstName: "John", lastName: "Doe",
//   birthday: "1985-01-01", teamId: 1, positionId: 9
// }
```

### delete

```ts
const deletedPlayer = await query1<Player> (sql`
  delete from "player"
  where id = 1
  returning id
`);

// { id: 1 }
```

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

## Raw
With the Raw data type it is possible to inject values as raw text into the query. These values are not passed as parameters to [node-postgres](https://github.com/brianc/node-postgres).

```ts
import { raw } from "refql";

// dynamic properties
const idField = "id";
const bdField = "birthday";

const player = await query1<Player> (rql`
  player {
    id
    lastName
    age (${raw (bdField)})
    ${sql`
      where ${raw (idField)} = 1
    `}
  }
`);

// {
//   id: 1,
//   lastName: "Lefèvre",
//   age: "30 years 2 mons 22 days"
// };
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