import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import SQLTag from ".";
import { flConcat, flEmpty, flMap } from "../common/consts";
import { Querier, StringMap } from "../common/types";
import Raw from "../Raw";
import { Player } from "../soccer";
import Table from "../Table";
import format from "../test/format";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import { player } from "../test/tables";
import userConfig from "../test/userConfig";
import Values from "../Values";
import Values2D from "../Values2D";
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
    expect (tag.interpreted).toBe (undefined);
    expect (SQLTag.isSQLTag (tag)).toBe (true);
    expect (SQLTag.isSQLTag ({})).toBe (false);
  });

  test ("Semigroup", () => {
    const tag = sql`select id, ${rawLastName}`;
    const tag2 = sql`from player`;
    const tag3 = sql`where id = ${2}`;

    const tag4 = tag[flConcat] (tag2)[flConcat] (tag3);
    const tag5 = tag[flConcat] (tag2[flConcat] (tag3));

    expect (tag4.compile ()).toEqual (tag5.compile ());
  });

  test ("Monoid", () => {
    const tag = sql`select id from player`;

    const tag2 = tag[flConcat] (SQLTag[flEmpty] ());
    const tag3 = SQLTag[flEmpty] ()[flConcat] (tag);

    expect (tag2.compile ()).toEqual (tag.compile ());
    expect (tag3.compile ()).toEqual (tag.compile ());
  });

  test ("Functor", () => {
    const tag = sql`select * from player where id = ${1}`;

    const limit = (nodes: any[]) => nodes.concat (Raw ("limit 10"));
    const offset = (nodes: any[]) => nodes.concat (Raw ("offset 0"));

    const tag2 = tag[flMap] (v => v);
    expect (tag2.compile ()).toEqual (tag.compile ());

    const tag3 = tag[flMap] (v => offset (limit (v)));
    const tag4 = tag[flMap] (limit)[flMap] (offset);

    expect (tag3.compile ()).toEqual (tag4.compile ());
  });

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

    const params = {
      limit: 5,
      offset: 1
    };

    const [query, values] = tag.compile (params);

    expect (query).toBe (format (`
      select id, first_name, last_name
      from player
      limit $1
      offset $2
    `));

    expect (values).toEqual ([5, 1]);

    const players = await tag.run (querier, params);

    expect (Object.keys (players[0])).toEqual (["id", "first_name", "last_name"]);
    expect (players.length).toBe (5);
  });

  test ("Values", async () => {
    const tag = sql<{ids: number[]}, Player>`
      select id, first_name, ${rawLastName}
      from player
      where id in ${Values (p => p.ids)}
    `;

    const [query, values] = tag.compile ({ ids: [3, 4] });

    expect (query).toBe (format (`
      select id, first_name, last_name
      from player
      where id in ($1, $2)
    `));

    expect (values).toEqual ([3, 4]);

    const players = await tag.run (querier, { ids: [3, 4] });

    expect (players[0].id).toBe (3);
    expect (players[1].id).toBe (4);
    expect (players.length).toBe (2);
  });

  test ("insert", async () => {
    const isPG = process.env.DB_TYPE === "pg";
    console.log (isPG);
    let cars = '["Mercedes", "volvo"]';
    if (isPG) {
      cars = JSON.parse (cars);
    }

    const insert = sql<{fields: string[]; table: Table; data: StringMap}, any>`
      insert into ${Raw (p => `${p.table}`)}
      ${Raw (p => `(${p.fields.join (", ")})`)}
      values ${Values (p => p.fields.map (f => p.data[f]))}
    `;

    const params = {
      table: player,
      fields: ["first_name", "last_name", "cars"],
      data: { first_name: "John", last_name: "Doe", cars }
    };

    const [query, values] = insert.compile (params);

    expect (query).toBe (format (`
      insert into player (first_name, last_name, cars)
      values ($1, $2, $3)
    `));

    expect (values).toEqual (["John", "Doe", cars]);

    await insert.run (querier, params);

    let returning = sql<{}, any>`
      select * from player
      where cars = CAST(${cars} as json)
      order by id desc
      limit 1
    `;

    if (isPG) {
      returning = sql<{}, any>`
        select * from player
        where cars = ${cars}
        order by id desc
        limit 1
      `;
    }

    const players = await returning.run (querier);

    expect (players[0].first_name).toBe ("John");
    expect (players[0].last_name).toBe ("Doe");
    expect (players[0].cars).toEqual (isPG ? cars : JSON.parse (cars));
    expect (players.length).toBe (1);
  });

  test ("insert multiple", async () => {
    const insert = sql<{fields: string[]; table: Table; data: StringMap[]}, any>`
      insert into ${Raw (p => `${p.table}`)}
      ${Raw (p => `(${p.fields.join (", ")})`)}
      values ${Values2D (p => p.data.map (x => p.fields.map (f => x[f])))}
    `;

    const params = {
      table: player, fields: ["first_name", "last_name"],
      data: [
        { first_name: "John", last_name: "Doe" },
        { first_name: "Jane", last_name: "Doe" }
      ]
    };

    const [query, values] = insert.compile (params);

    expect (query).toBe (format (`
      insert into player (first_name, last_name)
      values ($1, $2), ($3, $4)
    `));

    expect (values).toEqual (["John", "Doe", "Jane", "Doe"]);

    await insert.run (querier, params);

    const returning = sql<{}, any>`
      select * from player
      order by id desc
      limit 2
    `;

    const players = await returning.run (querier);

    expect (players[0].first_name).toBe ("Jane");
    expect (players[1].first_name).toBe ("John");
    expect (players.length).toBe (2);
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


// ARRAYS ?