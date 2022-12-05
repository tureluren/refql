import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import SQLTag from ".";
import { flConcat, flEmpty, flMap } from "../common/consts";
import { Querier, StringMap } from "../common/types";
import { Variable } from "../nodes";
import Raw from "../Raw";
import { Player } from "../soccer";
import Table from "../Table";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import { player } from "../test/tables";
import userConfig from "../test/userConfig";
import Values from "../Values";
import sql from "./sql";

describe ("SQLTag type", () => {
  let pool: any;
  let querier: Querier;

  if (process.env.DB_TYPE === "mysql") {
    pool = mySQL.createPool (userConfig ("mysql"));
    querier = mySQLQuerier (pool);
  } else if (process.env.DB_TYPE === "mariadb") {
    pool = mariaDB.createPool (userConfig ("mariadb"));
    querier = mariaDBQuerier (pool);
  } else {
    pool = new pg.Pool (userConfig ("pg"));
    querier = pgQuerier (pool);
  }

  const rawLastName = Raw ("last_name");

  afterAll (() => {
    pool.end ();
  });

  test ("create SQLTag", () => {
    const nodes = [Raw ("select first_name, last_name"), Raw ("from player")];
    const tag = SQLTag (nodes);

    expect (tag.nodes).toEqual (nodes);
    expect (tag.compiled).toBe (undefined);
    expect (SQLTag.isSQLTag (tag)).toBe (true);
    expect (SQLTag.isSQLTag ({})).toBe (false);
  });

  test ("Semigroup", () => {
    const tag = sql`select id, ${rawLastName}`;
    const tag2 = sql`from player`;
    const tag3 = sql`where id = ${2}`;

    const res = tag[flConcat] (tag2)[flConcat] (tag3);
    const res2 = tag[flConcat] (tag2[flConcat] (tag3));

    expect (res).toEqual (res2);
  });

  test ("Monoid", () => {
    const tag = sql`select id from player`;

    expect (tag[flConcat] (SQLTag[flEmpty] ())).toEqual (tag);
    expect (SQLTag[flEmpty] ()[flConcat] (tag)).toEqual (tag);
  });

  // test ("Functor", () => {
  //   const tag = sql`select * from player where id = ${1}`;

  //   const limit = (values: any[]) => values.concat (Raw ("limit 10"));
  //   const offset = (values: any[]) => values.concat (Raw ("offset 0"));

  //   expect (tag[flMap] (v => v)).toEqual (tag);

  //   expect (tag[flMap] (v => offset (limit (v))))
  //     .toEqual (tag[flMap] (limit)[flMap] (offset));
  // });

  test ("run", async () => {
    type Params = {
      limit: number;
      offset: number;
    };

    const paginate = sql<Params, Player>`
      limit ${p => p.limit}
      offset ${p => p.offset}
    `;

    const tag = sql<Params, Player>`
      select id, first_name, ${rawLastName}
      from player
      ${paginate}
    `;

    const players = await tag.run (querier, { limit: 5, offset: 1 });

    expect (Object.keys (players[0])).toEqual (["id", "first_name", "last_name"]);
    expect (players.length).toBe (5);
  });

  test ("Values", async () => {
    const tag = sql<{ids: number[]}, Player>`
      select id, first_name, ${rawLastName}
      from player
      where id in ${Values (p => p.ids)}
    `;

    const players = await tag.run (querier, { ids: [3, 4] });

    expect (players[0].id).toBe (3);
    expect (players[1].id).toBe (4);
    expect (players.length).toBe (2);
  });

  test ("insert", async () => {
    const insert = sql<{fields: string[]; table: Table; data: StringMap}, Player>`
      insert into ${Raw (p => `${p.table}`)}
      ${Raw (p => `(${p.fields.join (", ")})`)}
      values ${Values (p => p.fields.map (f => p.data[f]))}
      returning *
    `;

    const raw = Raw ("buh");

    const players = await insert.run (querier, {
      table: player, fields: ["first_name", "last_name"], data: { first_name: "John", last_name: "Doe" }
    });

    console.log (players);
  });

  test ("insert multiple", async () => {
    const insert = sql<{fields: string[]; table: Table; data: StringMap[]}, Player>`
      insert into ${Raw (p => `${p.table}`)}
      ${Raw (p => `(${p.fields.join (", ")})`)}
      values ${Values (p => p.fields.map (f => p.data[f]))}
      returning *
    `;

    const players = await insert.run (querier, {
      table: player, fields: ["first_name", "last_name"], data: [
        { first_name: "John", last_name: "Doe" },
        { first_name: "jane", last_name: "Doe" }
      ]
    });

    console.log (players);
  });

});
// test ("errors", async () => {
//   try {
//     const tag = sql`
//       select ${Table ("player")`id`}
//     `;
//     await tag.run (() => Promise.resolve ([]), undefined);
//   } catch (err: any) {
//     expect (err.message).toBe ("You can't use RQL Tags inside SQL Tags");
//   }
// });

// const insert = sql<{fields: string[]; table: Table; data: StringMap}, any>`
//   insert into ${Raw (p => `${p.table}`)}
//   ${p => Raw (p.fields.join (","))}
//   values ${p => p.fields.map (f => p.data[f]))}
// `;

// const insert = sql<{fields: string[]; table: Table; data: StringMap[]}, any>`
//   insert into ${Raw (p => `${p.table}`)}
//   ${Raw (p => p.fields.join (","))}
//   values ${Values(p => p.data.map(rec => Values(p.fields.map (f => rec[f])))}
// `;

// List can hold array of arrays

// const insertInto = (table: Table) =>
//   insert.run ({ table });