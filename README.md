# RefQL
A Node.js and Deno library for composing and running SQL queries.

<img height="358" width="452" alt="RefQL example" src="https://raw.githubusercontent.com/tureluren/refql/main/example.gif">


## Installation
```bash
yarn install refql
# or
npm install refql 
```

## Getting started
```ts
import { Pool } from "pg";
import { belongsTo, sql, Table } from "refql";

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
* [Tables and References](#tables-and-references)
* [Querier](#querier)
* [Function Placeholder](#function-placeholder)
* [Fantasy Land Interoperability](#fantasy-land-interoperability)
* [Raw](#raw)
* [When](#when)
* [Values](#values)
* [Values2D](#values2d)
* [Comments](#comments)
* [Functions, subselects, aliases, casts, literals, :1](#functions-subselects-aliases-casts-literals-1)

## Tables and References
The example below shows how to define tables and describe their references to other tables. From then on, these references can be used in a `RQLTag`. Relationships are created by passing the table name as a string instead of passing a `Table` object. This is to avoid circular dependency problems. `Tables` are uniquely identifiable by the combination schema and tableName `(<schema>.<tableName>)`.

```ts
import { Pool } from "pg";
import { 
  belongsTo, belongsToMany, hasMany,
  hasOne, sql, Table
} from "refql";

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
### Ref info
RefQL tries to link 2 tables based on logical column names, using snake case. You can always point RefQL in the right direction if this doesn't work for you.

```ts
const playerBelongsToManyGames = belongsToMany ("game", {
  lRef: "id",
  rRef: "id",
  lxRef: "player_id",
  rxRef: "game_id",
  xTable: "game_player",
  as: "games"
});
```


## Querier
The querier should have the type signature `<T>(query: string, values: any[]) => Promise<T[]>`. This function is a necessary in-between piece to make RefQL independent from database clients. This allows you to choose your own client. This is also the place where you can debug or transform a query before it goes to the database or when the result is obtained. Example of a querier for mySQL:

```ts
import mySQL from "mysql2";

const mySQLPool = mySQL.createPool ({
  // ...pool options
});

const mySQLQuerier = <T>(query: string, values: any[]): Promise<T[]> =>
  new Promise ((res, rej) => {
    mySQLPool.query (query.replace (/\$\d/g, "?"), values, (error, rows) => {
      if (error) {
        rej (error);
        return;
      }
      res (rows as T[]);
    });
  });
```

### Create `sql` with default querier that returns another container type
U can use [Module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) in TypeScript to register another container type.

```ts
import { parse, SQLTag, SQLTagVariable } from "refql";

declare module "refql" {
  interface BoxRegistry<Output> {
    readonly Task: Task<Output>;
  }
}

class Task<Output> {
  fork: (rej: (e: any) => void, res: (x: Output) => void) => void;

  constructor(fork: (rej: (e: any) => void, res: (x: Output) => void) => void) {
    this.fork = fork;
  }
}

// natural transformation
const promiseToTask = <Output>(p: Promise<Output>) =>
  new Task<Output> ((rej, res) => p.then (res).catch (rej));

const sql = <Params = {}, Output = unknown> (strings: TemplateStringsArray, ...variables: SQLTagVariable<Params, Output, "Task">[]) => {
  const nodes = parse <Params, Output, "Task"> (strings, variables);
  return SQLTag (nodes, defaultQuerier, promiseToTask);
};

const tag = sql<{}, { id: number; first_name: string }[]>`
  select id, first_name,
`;

const tag2 = sql<{}, { last_name: string }[]>`
  last_name
  from player
  limit 1
`;

const tag3 = tag.concat (tag2);

// no need to provide a querier anymore
tag3 ().fork (console.error, console.log);

// [ { id: 1, first_name: "Georgia", last_name: "Marquez" } ];
```

### Create `Table` with default querier that returns another container type
U can use [Module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) in TypeScript to register another container type.

```ts
import { Ref, sql, Table } from "refql";

declare module "refql" {
  interface BoxRegistry<Output> {
    readonly Task: Task<Output>;
  }
}

class Task<Output> {
  fork: (rej: (e: any) => void, res: (x: Output) => void) => void;

  constructor(fork: (rej: (e: any) => void, res: (x: Output) => void) => void) {
    this.fork = fork;
  }
}

// natural transformation
const promiseToTask = <Output>(p: Promise<Output>) =>
  new Task<Output> ((rej, res) => p.then (res).catch (rej));

const Table = (name: string, refs: Ref<"Task">[] = []) => {
  return Table<"Task"> (name, refs, defaultQuerier, promiseToTask);
};

const Player = Table ("Player");

const tag = Player<{}, { id: number; first_name: string }[]>`
  id
  first_name
`;

const tag2 = Player<{}, { last_name: string; team: { name: string } }[]>`
  last_name
  ${sql`
    limit 1 
  `}
`;

const tag3 = tag.concat (tag2);

// no need to provide a querier anymore
tag3 ().fork (console.error, console.log);

// [ { id: 1, first_name: "Georgia", last_name: "Marquez" } ];
```

## Function placeholder
If you use a function placeholder inside a `SQLTag` or `RQLTag`, the first parameter of that function will be the parameters with which you execute the tag. If you're working on a `RQLTag`, u can also access the table through the second parameter of the function placeholder. [Raw](#raw), [When](#when), [Values](#values) and [Values2D](#values2d) can also be constructed with this function.

```ts
const orderedTeamPlayers = Table ("Player")<{ team_id: number; order_by: string }>`
  *
  ${sql`
    and team_id = ${p => p.team_id}
    order by ${Raw ((p, t) => `${t}.${p.order_by}`)} 
  `}
`;

orderedTeamPlayers ({ team_id: 1, order_by: "first_name" }, querier).then (console.log);

// [
//   {
//     id: 3,
//     first_name: 'Celia',
//     last_name: 'Sbolci',
//     team_id: 1
//   },
//   {
//     id: 5,
//     first_name: 'Eleanor',
//     last_name: 'Klein',
//     team_id: 1
//   },
//   {
//     id: 6,
//     first_name: 'Eliza',
//     last_name: 'Pasquini',
//     team_id: 1
//   },
//   ...
// ]
```

## Fantasy Land Interoperability
<a href="https://github.com/fantasyland/fantasy-land"><img width="82" height="82" alt="Fantasy Land" src="https://raw.github.com/puffnfresh/fantasy-land/master/logo.png"></a>

Both `RQLTag` and `SQLTag` are `Semigroup` structures. `RQLTag` is also a `Monoid` and `Table` is a `Setoid`.

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

const playerById = idAndFirstName
  .concat (lastNameAndTeam);

playerById ({ id: 1 }).then (console.log);

// [
//   {
//     id: 1,
//     first_name: 'Georgia',
//     last_name: 'Marquez',
//     team: { name: 'FC Evatelo' }
//   }
// ]
```

## Raw
With the Raw data type it's possible to inject values as raw text into the query.

```ts
import { Raw } from "refql";

// dynamic properties
const idField = "id";
const bdField = "birthday";

const Player = Table ("player");

const playerById = sql<{ id: number }>`
  select id, last_name, age (${Raw (bdField)})::text
  from ${Player} where ${Raw (idField)} = ${p => p.id}
`;

// query: select id, last_name, age (birthday)::text from player where id = $1
// values: [1]

playerById ({ id: 1 }).then (console.log);

// [ { id: 1, last_name: 'Short', age: '27 years 9 mons 1 day' } ]
```

## When
`When` takes a predicate and a `SQLTag`. If the predicate returns true, the tag is added to `searchPlayer`.
```ts
import { When } from "refql";

const searchPlayer = Player<{ q?: string; limit?: number }>`
  id
  last_name
  ${When (p => p.q != null, sql`
    and last_name like ${p => `%${p.q}%`}
  `)}
  ${When (p => p.limit != null, sql`
    limit ${p => p.limit} 
  `)}
`;

searchPlayer ({ limit: 5, q: "ba" }).then (console.log);

// [
//   { id: 25, last_name: 'Ibanez' },
//   { id: 355, last_name: 'Lombardi' },
//   { id: 409, last_name: 'Gambacciani' },
//   { id: 546, last_name: 'Caballero' }
// ]
```

## Values
Useful when you want to create dynamic queries, such as inserts or queries with the `in` operator.

```ts
import { Values } from "refql";

const Player = Table ("player");

// select id, last_name from player where id in ($1, $2, $3)
const selectPlayers = sql<{ ids: number[]}>`
  select id, last_name
  from ${Player}
  where id in ${Values (p => p.ids)}
`;

selectPlayers ({ ids: [1, 2, 3] }).then (console.log);

// [
//   { id: 1, last_name: 'Short' },
//   { id: 2, last_name: 'Owens' },
//   { id: 3, last_name: 'Sbolci' }
// ]

```
## Values2D
Useful for batch inserts.

```ts
import { Values2D } from "refql";

interface Player {
  first_name: string;
  last_name: string;
}

const Player = Table ("player", [], querier);

const insertBatch = sql<{ fields: (keyof Player)[]; data: Player[] }, Player[]>`
  insert into ${Player} (${Raw (p => p.fields.join (", "))})
  values ${Values2D (p => p.data.map (x => p.fields.map (f => x[f])))}
  returning *
`;

insertBatch ({
  fields: ["first_name", "last_name"],
  data: [
    { first_name: "John", last_name: "Doe" },
    { first_name: "Jane", last_name: "Doe" },
    { first_name: "Jimmy", last_name: "Doe" }
  ]
}, querier).then (console.log);

// [
//   {
//     id: 733,
//     first_name: 'John',
//     last_name: 'Doe'
//   },
//   {
//     id: 734,
//     first_name: 'Jane',
//     last_name: 'Doe'
//   },
//   {
//     id: 735,
//     first_name: 'Jimmy',
//     last_name: 'Doe'
//   }
// ]
```

## Comments
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

## Functions, subselects, aliases, casts, literals, :1
Some other features of RefQL.

```ts
import { Pool } from "pg";
import { hasMany, sql, Table } from "refql";

const pool = new Pool ({
  // ...pool options
});

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

const Goal = Table ("goal");

const Player = Table ("player", [
  hasMany ("goal")
], querier);

const byId = sql<{id: number}>`
  and id = ${p => p.id}
`;

const goalCount = sql<{}>`
  select count(*) from ${Goal}
  where player_id = player.id
`;

const features = Player`
  *
  id::text
  ${goalCount}:goal_count::int
  concat:full_name (first_name, " ", last_name)
  true:is_player
  ${Goal}:1 first_goal
  ${byId}
`;

features ({ id: 9 }).then (console.log);

// [
//   {
//     id: '9',
//     first_name: 'Phoebe',
//     last_name: 'van Dongen',
//     cars: null,
//     birthday: 1992-02-25T23:00:00.000Z,
//     team_id: 1,
//     position_id: 9,
//     goal_count: 6,
//     full_name: 'Phoebe van Dongen',
//     is_player: true,
//     first_goal: { id: 2, game_id: 1, player_id: 9, own_goal: false, minute: 30 }
//   }
// ]
```