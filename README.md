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
import { 
  BelongsTo, NumberProp, 
  StringProp, Table 
} from "refql";

// id Prop
const id = NumberProp ("id");

// Tables
const Player = Table ("player", [
  id,
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  BelongsTo ("team", "team")
]);

const Team = Table ("team", [
  id,
  StringProp ("name")
]);

// query composition
const playerById = Player ([
  id,
  "firstName",
  "lastName",
  Team ([
    "id",
    "name"
  ]),
  id.eq<{ id: number }> (p => p.id)
]);

const pool = new Pool ({
  // ...pool options
});

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

playerById ({ id: 1 }, querier).then(console.log);

// [
//   {
//     id: 1,
//     firstName: "Christine",
//     lastName: "Hubbard",
//     team: { id: 1, name: "FC Agecissak" }
//   }
// ];
```

## Table of contents
* [Tables and References](#tables-and-references)
* [Querier](#querier)
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
  BelongsTo, BelongsToMany, HasMany,
  HasOne, Limit, NumberProp, Offset,
  StringProp, Table
} from "refql";

const pool = new Pool ({
  // ...pool options
});

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

const Player = Table ("player", [
  NumberProp ("id"),
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  BelongsTo ("team", "public.team"),
  HasOne ("rating", "rating"),
  HasMany ("goals", "goal"),
  BelongsToMany ("games", "game")
]);

const Team = Table ("public.team", [
  StringProp ("name")
]);

const Rating = Table ("rating", [
  NumberProp ("finishing"),
  NumberProp ("dribbling"),
  NumberProp ("tackling")
]);

const Game = Table ("game", [
  StringProp ("result")
]);

const Goal = Table ("goal", [
  NumberProp ("minute")
]);

const fullPlayer = Player ([
  "id",
  "firstName",
  "lastName",
  Team (["name"]),
  Goal (["minute"]),
  Rating (["*"]),
  Game (["result"]),
  Limit (),
  Offset ()
]);

fullPlayer ({ limit: 1, offset: 8 }, querier).then(console.log);

// [
//   {
//     id: 9,
//     firstName: "Leah",
//     lastName: "Kennedy",
//     team: { name: "FC Agecissak" },
//     goals: [{ minute: 36 }, { minute: 20 }, { minute: 87 }, ...],
//     rating: { finishing: 82, dribbling: 48, tackling: 47 },
//     games: [{ result: "5 - 4" }, { result: "4 - 0" }, { result: "4 - 5" }, ...]
//   }
// ];
```
### Ref info
RefQL tries to link 2 tables based on logical column names, using snake case. You can always point RefQL in the right direction if this doesn't work for you.

```ts
const playerBelongsToManyGames = BelongsToMany ("games", "game", {
  lRef: "id",
  rRef: "id",
  lxRef: "player_id",
  rxRef: "game_id",
  xTable: "game_player"
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

### Set a default querier

```ts
import { setDefaultQuerier } from "refql";

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

setDefaultQuerier (querier);

const firstTeam = Player ([
  id,
  "firstName",
  "lastName",
  Limit (),
  id.asc ()
]);

// no need to provide a querier anymore
firstTeam ({ limit: 10 }).then (console.log);
```

### Convert Promise output to something else 
U can use [Module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) in TypeScript to register another container type.

```ts
import { setConvertPromise } from "refql";

declare module "refql" {
  interface RQLTag<TableId extends string = any, Params = any, Output = any> {
    (params?: Params, querier?: Querier): Task<Output>;
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

setConvertPromise (promiseToTask);

const firstTeam = Player ([
  id,
  "firstName",
  "lastName",
  Limit (),
  id.asc ()
]);


// `fork` instead of `then`
firstTeam ({ limit: 10 }).fork (console.error, console.log);

// [
//   { id: 1, firstName: "Christine", lastName: "Hubbard" },
//   { id: 2, firstName: "Emily", lastName: "Mendez" },
//   { id: 3, firstName: "Stella", lastName: "Kubo" },
//   { id: 4, firstName: "Celia", lastName: "Misuri" },
//   { id: 5, firstName: "Herbert", lastName: "Okada" },
//   { id: 6, firstName: "Terry", lastName: "Bertrand" },
//   { id: 7, firstName: "Fannie", lastName: "Guerrero" },
//   { id: 8, firstName: "Lottie", lastName: "Warren" },
//   { id: 9, firstName: "Leah", lastName: "Kennedy" },
//   { id: 10, firstName: "Lottie", lastName: "Giraud" },
//   { id: 11, firstName: "Marc", lastName: "Passeri" }
// ];
```

## Fantasy Land Interoperability
<a href="https://github.com/fantasyland/fantasy-land"><img width="82" height="82" alt="Fantasy Land" src="https://raw.github.com/puffnfresh/fantasy-land/master/logo.png"></a>

Both `RQLTag` and `SQLTag` are `Semigroup` structures. `RQLTag` is also a `Monoid` and `Table` is a `Setoid`.

```ts
const Player = Table ("player", [
  BelongsTo ("team")
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
import { HasMany, sql, Table } from "refql";

const pool = new Pool ({
  // ...pool options
});

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

const Goal = Table ("goal");

const Player = Table ("player", [
  HasMany ("goal")
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