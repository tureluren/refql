# RefQL
A Node.js and Deno library for composing and running typesafe SQL queries.

## Installation
```bash
npm install refql 
```

## Create RefQL Instance
```ts
// refql.ts
import { Pool } from "pg";
import RefQL from "refql";

const pool = new Pool ({
  // ...pool options
});

const querier = (query: string, values: any[]) =>
  pool.query (query, values).then(({ rows }) => rows)

const refql = RefQL ({ 
  querier
});

export default refql;
```

## Introspect database schema (Postgres only, ran seperately from main project)
```ts
import refql from "./refql";

refql.introspect().then(() => {
  console.log("RefQL Tables stored inside node_modules/.refql");
})
```

## Read referenced data easily
```ts
import refql from "./refql";

const { Player, Team, League, Rating, Goal, Assist } = refql.tables.public;

const { id } = Team.props;

// select components
const teamById = Team ([
  Player ([
    Rating,
    Goal,
    Assist
  ]),
  League,
  Game,
  id.eq<{ id: number }> (p => p.id)
]);

teamById ({ id: 1 }).then(console.log);

// [
//   {
//     name: "FC Horgawid",
//     players: [
//       {
//         firstName: "Clifford",
//         lastName: "Morton",
//         rating: { acceleration: 71, finishing: 41, positioning: 83 },
//         goals: [{  ownGoal: false, minute: 74 }, ...],
//         assists: [{ goalId: 13, playerId: 9 }, ...]
//       },
//       ...
//     ],
//     league: { name: "Falkland Islands league" },
//     games: [
//       {
//         homeTeamId: 1,
//         awayTeamId: 8,
//         result: "0 - 2"
//       },
//       ...
//     ]
//   }
// ];
```

## Table of contents
* [Options](#options)
* [Querier](#querier)
* [Tables and References](#tables-and-references)
* [Fantasy Land Interoperability](#fantasy-land-interoperability)
* [Operator Mix](#operator-mix)
* [Insert, update and delete](#insert-update-and-delete)
* [SQLTag](#sqltag)

## Options
```ts
import { Pool } from "pg";
import RefQL from "refql";

const pool = new Pool ({
  // ...pool options
});

const pgQuerier = (query: string, values: any[]) =>
  pool.query (query, values).then(({ rows }) => rows)

const refql = RefQL ({
  // querier
  querier: postgresQuerier,

  // database case type - optional
  casing: "snake_case"

  // sign used for parameterized queries - optional
  parameterSign: "$",

  // using indexed parameters or not ($1, $2, ...) - optional
  indexedParameters: true,

  // run tag and transform result - optional
  runner: (tag, params) => tag.run(params)
});
```

## Querier
The querier should have the type signature `<T>(query: string, values: any[]) => Promise<T[]>`. This function is a necessary in-between piece to make RefQL independent from database clients. This allows you to choose your own client. This is also the place where you can debug or transform a query before it goes to the database or when the result is obtained. Example of a querier for mySQL:

```ts
import mySQL from "mysql2";
import RefQL from "refql";

const mySQLPool = mySQL.createPool ({
  // ...pool options
});

const mySQLQuerier = <T>(query: string, values: any[]): Promise<T[]> =>
  new Promise ((res, rej) => {
    mySQLPool.query (query, values, (error, rows) => {
      if (error) {
        rej (error);
        return;
      }
      res (rows as T[]);
    });
  });

const refql = RefQL ({
  querier: mySQLQuerier,
  parameterSign: "?",
  indexedParameters: false
});
```

### Convert Promise output to something else 
U can use [Module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) in TypeScript to register another container type.

```ts
import RefQL from "refql";

declare module "refql" {
  interface RQLTag<TableId extends string = any, Params = any, Output = any> {
    (params?: Params): Task<Output>;
  }
}

class Task<Output> {
  fork: (rej: (e: any) => void, res: (x: Output) => void) => void;

  constructor(fork: (rej: (e: any) => void, res: (x: Output) => void) => void) {
    this.fork = fork;
  }
}

// transformation function
const promiseToTask = <Output>(p: Promise<Output>) =>
  new Task<Output> ((rej, res) => p.then (res).catch (rej));

const { tables }  = RefQL ({
  // ...refql options
  runner: (tag, params) => promiseToTask (tag.run(params))
});

const { Player } = tables;

const firstTen = Player ([
  id.asc(),
  "firstName",
  "lastName",
  Limit (10),
]);

// `fork` instead of `then`
firstTen ().fork (console.error, console.log);

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
//   { id: 10, firstName: "Lottie", lastName: "Giraud" }
// ];
```


## Tables and References
For now, introspection only works for PostgreSQL databases. The example below shows how u can define tables and describe their references to other tables. Relationships are created by passing the table name as a string instead of passing a `Table` object. This is to avoid circular dependency problems. `Tables` are uniquely identifiable by the combination schema and tableName `(<schema>.<tableName>)`.

```ts
import { 
  BelongsTo, BelongsToMany, HasMany, HasOne, 
  NumberProp, Offset, StringProp,
} from "refql";
import refql from "./refql";;

const { Table } = refql;

const Player = Table ("player", [
  NumberProp ("id"),
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  BelongsTo ("team", "public.team"),
  HasOne ("rating", "rating"),
  HasMany ("goals", "goal"),
  BelongsToMany ("games", "game")
]);
```

### Ref info
RefQL tries to link 2 tables based on logical column names, using the "casing" option. You can always point RefQL in the right direction if this doesn't work for you by specifying refs yourself.

```ts
const playerBelongsToManyGames = BelongsToMany ("games", "game", {
  lRef: ["id"],
  rRef: ["id"],
  lxRef: ["player_id"],
  rxRef: ["game_id"],
  xTable: ["game_player"]
});
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
  Team (["name"])
]);

const readPage =
  part1
    .concat (part2)
    .concat (Player ([
      Limit<{ limit: number }> (p => p.limit),
      Offset<{ offset: number }> (p => p.offset)
    ]));

readPage ({ limit: 5, offset: 0 }).then (console.log);
// [
//   {
//     id: 1,
//     firstName: "Christine",
//     lastName: "Hubbard",
//     team: { id: 1, name: "FC Agecissak" }
//   },
//   ...
// ];
```

## Operator mix

```ts
import { NumberProp, sql } from "refql";

// subselect
const goalCount = NumberProp ("goalCount", sql`
  select cast(count(*) as int) from goal
  where goal.player_id = player.id
`);

const { teamId, firstName, lastName } = Player.props;

const readStrikers = Player ([
  goalCount.gt (7),
  teamId
    .eq (1)
    // "teamId" column will not be in the result
    .omit (),

  // the `like` operator takes a second argument which is a predicate
  // that receives the parameters and returns true or false.
  // When false, the `like` operation will be skipped in the query.
  lastName
    .like<{ q?: string}> (p => p.q, p => p.q != null)
    // order by lastName asc
    .asc (),

  firstName.iLike ("ar%")
]);

const readStrikersPage = readStrikers
  .concat (Player ([Limit (5), Offset (0)]));

readStrikersPage ({ q: "Gra%" }).then (console.log);

// [
//   {
//     id: 14,
//     firstName: "Arthur",
//     lastName: "Graham",
//     goalCount: 14
//   }
// ];
```

## SQLTag
If something can't be done by using the functions provided by RefQL, use `sql`.

```ts
import { NumberProp, sql, StringProp, Table } from "refql";

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
import { Raw, sql, Table } from "refql";

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
import { sql, Table, Values } from "refql";

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
import { Table, Raw, sql, Values2D } from "refql";

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