# RefQL
A Node.js and Deno library for composing and running SQL queries.

<img width="584" height="328" alt="RefQL example" src="https://raw.githubusercontent.com/tureluren/refql/main/example.gif">


## Installation
```bash
yarn install refql
# or
npm install refql 
```

## Getting started
```ts
import postgres from "https://deno.land/x/postgresjs/mod.js";
import { 
  BelongsTo, NumberProp, 
  StringProp, Table 
} from "https://deno.land/x/refql/mod.ts";

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

// select components
const playerById = Player ([
  id,
  "firstName",
  "lastName",
  Team ([
    id,
    "name"
  ]),
  id.eq<{ id: number }> (p => p.id)
]);

const pool = postgres ({
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
* [Compare](#compare)
* [OrderBy, Limit and Offset](#orderby-limit-and-offset)
* [When](#when)
* [Functions and subselects](#functions-and-subselects)
* [SQLTag](#sqltag)

## Tables and References
The example below shows how to define tables and describe their references to other tables. From then on, these references can be used in a `RQLTag`. Relationships are created by passing the table name as a string instead of passing a `Table` object. This is to avoid circular dependency problems. `Tables` are uniquely identifiable by the combination schema and tableName `(<schema>.<tableName>)`.

```ts
import postgres from "https://deno.land/x/postgresjs/mod.js";
import { 
  BelongsTo, BelongsToMany, HasMany,
  HasOne, Limit, NumberProp, Offset,
  StringProp, Table
} from "https://deno.land/x/refql/mod.ts";

const pool = postgres ({
  // ...pool options
});

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

// construct RQLTag
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
  Limit (1),
  Offset (8)
]);

fullPlayer ({}, querier).then (console.log);

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
  lxRef: "playerId",
  rxRef: "gameId",
  xTable: "gamePlayer"
});
```

## Querier
The querier should have the type signature `<T>(query: string, values: any[]) => Promise<T[]>`. This function is a necessary in-between piece to make RefQL independent from database clients. This allows you to choose your own client. This is also the place where you can debug or transform a query before it goes to the database or when the result is obtained. Example of a querier for mySQL:

```ts
import * as mySQL from "https://deno.land/x/mysql2/mod.ts";

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
import { setDefaultQuerier } from "https://deno.land/x/refql/mod.ts";

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};

setDefaultQuerier (querier);

const firstTeam = Player ([
  id,
  "firstName",
  "lastName",
  Limit (10),
  id.asc ()
]);

// no need to provide a querier anymore
firstTeam ({ limit: 10 }).then (console.log);
```

### Convert Promise output to something else 
U can use [Module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) in TypeScript to register another container type.

```ts
import { setConvertPromise } from "https://deno.land/x/refql/mod.ts";

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
  Limit (10),
  id.asc ()
]);

// `fork` instead of `then`
firstTeam ().fork (console.error, console.log);

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

Both `RQLTag` and [`SQLTag`](#sqltag) are `Semigroup` structures.

```ts
const part1 = Player ([
  id,
  "firstName",
  Team (["id"])
]);

const part2 = Player ([
  "lastName",
  Team (["name"]),
  id.eq<{ id: number }> (p => p.id)
]);

const playerById = part1.concat (part2);

playerById ({ id: 1 }).then (console.log);

// [
//   {
//     id: 1,
//     firstName: "Christine",
//     lastName: "Hubbard",
//     team: { id: 1, name: "FC Agecissak" }
//   }
// ];
```

## Compare

```ts
import { NumberProp, sql, StringProp, Table } from "https://deno.land/x/refql/mod.ts";

const Player = Table ("player", [
  NumberProp ("id"),
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  NumberProp ("teamId", "team_id").nullable (),
  NumberProp ("goalCount", sql`
    select cast(count(*) as int) from goal
    where goal.player_id = player.id
  `)
]);

const { goalCount, lastName, teamId } = Player.props;

const strikers = Player ([
  "*",
  goalCount,
  teamId.eq (1),
  goalCount.gt (7),
  lastName.like ("Craw%")
]);

strikers ().then (console.log);

// [
//   {
//     id: 6,
//     firstName: "Verna",
//     lastName: "Crawford",
//     teamId: 1,
//     goalCount: 11
//   }
// ];
```

## OrderBy, Limit and Offset
```ts
import { NumberProp, Limit, Offset, StringProp, Table } from "https://deno.land/x/refql/mod.ts";

const Player = Table ("player", [
  NumberProp ("id"),
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name")
]);

const { lastName } = Player.props;

const orderByLastName = Player ([
  "*",
  lastName.desc (),
  Limit<{ limit: number }> (p => p.limit),
  Offset<{ offset: number }> (p => p.offset)
]);

orderByLastName ({ limit: 5, offset: 30 }).then (console.log);

// [
//   { id: 410, firstName: "Marcus", lastName: "Volpe" },
//   { id: 248, firstName: "Clarence", lastName: "Vogt" },
//   { id: 615, firstName: "Daniel", lastName: "Vincent" },
//   { id: 228, firstName: "Lloyd", lastName: "Vidal" },
//   { id: 166, firstName: "Marian", lastName: "Vermeulen" }
// ];
```

## When
`When` takes a predicate and a list of operations. If the predicate returns true, the operations will be applied.

```ts
import { Limit, When } from "https://deno.land/x/refql/mod.ts";

const { id, lastName } = Player.props;

const searchPlayer = Player ([
  id,
  lastName,
  When (p => p.q != null, [
    lastName.like<{ q: string }> (p => p.q)
  ]),
  Limit (5)
]);

searchPlayer ({ q: "Ba" }).then (console.log);

// [
//   { id: 11, lastName: "Bardi" },
//   { id: 14, lastName: "Barchielli" },
//   { id: 22, lastName: "Baronti" },
//   { id: 23, lastName: "Baumann" },
//   { id: 72, lastName: "Barrett" }
// ];
```

## Functions and subselects
U can pass a [`SQLTag`](#sqltag) as the second argument to a `Prop` builder to select functions and subselects.

```ts
import { NumberProp, Limit, Offset, StringProp, Table } from "https://deno.land/x/refql/mod.ts";

const Player = Table ("player", [
  NumberProp ("id"),
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  StringProp ("fullName", sql`
    concat (player.first_name, ' ', player.last_name)
  `),
  NumberProp ("goalCount", sql`
    select count(*) from goal
    where goal.player_id = player.id
  `)
]);

const strikers = Player ([
  "id",
  "fullName",
  "goalCount",
  Limit (3),
  Offset (8)
]);

strikers ().then (console.log);

// [
//   { id: 9, fullName: "Leah Kennedy", goalCount: 10 },
//   { id: 10, fullName: "Lottie Giraud", goalCount: 7 },
//   { id: 11, fullName: "Marc Passeri", goalCount: 5 }
// ]
```

## SQLTag
If something can't be done by using the functions provided by RefQL, use `sql`.

```ts
import { NumberProp, sql, StringProp, Table } from "https://deno.land/x/refql/mod.ts";

const Player = Table ("player", [
  NumberProp ("id"),
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  NumberProp ("goalCount", sql`
    select count(*) from goal
    where goal.player_id = player.id
  `)
]);

const topScorers = Player ([
  "id",
  "firstName",
  "lastName",
  "goalCount",
  sql`
    and (
      select count(*) from goal
      where goal.player_id = player.id
    ) > 15
  `
]);

topScorers ().then (console.log);

// [
//   { id: 44, firstName: "Lester", lastName: "Rhodes", goalCount: 16 },
//   { id: 373, firstName: "Lucinda", lastName: "Moss", goalCount: 17 }
// ];

```

### Raw
With the Raw data type it's possible to inject values as raw text into the query.

```ts
import { Raw, sql, Table } from "https://deno.land/x/refql/mod.ts";

// dynamic properties
const idField = "id";
const bdField = "birthday";

const Player = Table ("player", []);

const playerById = sql<{ id: number }>`
  select id, last_name, age (${Raw (bdField)})::text
  from ${Player} where ${Raw (idField)} = ${p => p.id}
`;

// query: select id, last_name, age (birthday)::text from player where id = $1
// values: [1]

playerById ({ id: 1 }).then (console.log);

// [ { id: 1, last_name: "Hubbard", age: "26 years 1 mon 15 days" } ];
```

### Values
Useful when you want to create dynamic queries, such as inserts or queries with the `in` operator.

```ts
import { sql, Table, Values } from "https://deno.land/x/refql/mod.ts";

const Player = Table ("player", []);

// select id, last_name from player where id in ($1, $2, $3)
const selectPlayers = sql<{ ids: number[]}>`
  select id, last_name
  from ${Player}
  where id in ${Values (p => p.ids)}
`;

selectPlayers ({ ids: [1, 2, 3] }).then (console.log);

// [
//   { id: 1, last_name: "Hubbard" },
//   { id: 2, last_name: "Mendez" },
//   { id: 3, last_name: "Kubo" }
// ];

```

### Values2D
Useful for batch inserts.

```ts
import { Table, Raw, sql, Values2D } from "https://deno.land/x/refql/mod.ts";

interface Player {
  first_name: string;
  last_name: string;
}

const Player = Table ("player", []);

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
}).then (console.log);

// [
//   { id: 1020, first_name: "John", last_name: "Doe" },
//   { id: 1021, first_name: "Jane", last_name: "Doe" },
//   { id: 1022, first_name: "Jimmy", last_name: "Doe" }
// ];
```