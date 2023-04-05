import { Pool } from "pg";
import { InputSpec, Spec } from "./common/types2";
import { belongsTo } from "./nodes";
import Table from "./Table";
import Table2 from "./Table2";
import Field from "./Table2/Field";
import numberField from "./Table2/NumberField";
import tableF from "./Table2/tableF";
import varchar from "./Table2/varchar";


const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const querier = async (query: string, values: any[]) => {
  const { rows } = await pool.query (query, values);

  return rows;
};


interface Identifier {
  name: string;
  as: string;
}


const Player = Table2 ("player", {
  id: numberField ("id"),
  // ids: "foemp",
  firstName: varchar ("first_name"),
  team: tableF ("team")
});

const Team = Table2 ("team", {
  id: numberField ("id"),
  // ids: "foemp",
  name: varchar ("name"),
  league: tableF ("league")
});

const League = Table2 ("league", {
  id: numberField ("id"),
  // ids: "foemp",
  leagueName: varchar ("name")
});

const uuid = numberField ("uuid") ("uuiid");

const lastName = Field<"lastName", "last_name", string> ("lastName", "last_name");

const { firstName } = Player.spec;

const playerById = Player ([
  "id",
  firstName,
  // lastName,
  Team ([
    "id",
    "name",
    League (["id", "leagueName"])
  ])
]);




playerById ().then (res => console.log (res));

// const Player = Table ("player", {
//   id: varchar ("id"),
//   // select last_name as lastName
//   lastName: varchar ("last_name"),
//   team: belongsTo ("team", {})
// });

// const fullName = Fn<string> ("full_name", sql`
//   concat (${Player.first_name, " ", Player.last_name})
// `);

// const byId = sql`
//    and id = ${(p, t) => t.id}
// `;

// const playerById = Player ([
//   "first_name",
//   "last_name",
//   Team ([
//     "id",
//     "name"
//   ]),
//   byId
// ]);

// const playerById = Player`
//   id
//   last_name
//   ${Team`
//     id
//     last_name
//   `}
//   ${byId}
// `;

// const post = {
//   id: 1,
//   properties: 2,
//   created_time: "aaa",
//   other_prop: 2
// };

// function extractFromObj<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
//   return keys.reduce ((newObj, curr) => {
//     newObj[curr] = obj[curr];

//     return newObj;
//   }, {} as Pick<T, K>);
// }

// const result1 = extractFromObj (post, ["id", "properties", "created_time"]);

// // https://codyarose.com/blog/object-keys-from-array-in-typescript/
// const sizes = ["xs", "sm", "md", "lg", "xl"];

// type Values = { [K in typeof sizes[number]]: number };

// const values: Values = {
//   xs: 0,
//   sm: 600,
//   md: 960,
//   lg: 1280,
//   xl: 1920
// };

const test = <I extends InputSpec>(input: I, selection: (keyof I)[]) => {
  // const spec = Object.keys(I).reduce(k)
  const spec = input as unknown as Spec<I>;

  // return keys<Spec<I>> ().filter (k => selection.includes (k));
};

const t = test ({
  id: numberField ("id"),
  name: varchar ("name")
}, ["id"]);

