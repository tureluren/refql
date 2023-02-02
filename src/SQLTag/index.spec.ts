import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import SQLTag from ".";
import { flConcat, flContramap, flEmpty, flMap } from "../common/consts";
import { Querier, StringMap } from "../common/types";
import {
  all, BelongsToMany, Call, Identifier, Literal,
  Raw, RefNode, StringLiteral, Values, Values2D, Variable, When
} from "../nodes";
import { Player } from "../soccer";
import Table from "../Table";
import format from "../test/format";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import { dummy, dummyRefInfo, player } from "../test/tables";
import userConfig from "../test/userConfig";
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
    const tag = sql`
      select id, ${rawLastName}
    `;

    const tag2 = sql`
      from player
    `;

    const tag3 = sql`
      where id = ${2}
    `;

    const tag4 = tag[flConcat] (tag2)[flConcat] (tag3);
    const tag5 = tag[flConcat] (tag2[flConcat] (tag3));

    const [query, values] = tag4.compile ({});
    const [query2, values2] = tag5.compile ({});

    expect (query).toBe ("select id, last_name from player where id = $1");

    expect (values).toEqual ([2]);

    expect (query).toEqual (query2);
    expect (values).toEqual (values2);
  });

  test ("Monoid", () => {
    const tag = sql`select id from player`;

    const tag2 = tag[flConcat] (SQLTag[flEmpty] ());
    const tag3 = SQLTag[flEmpty] ()[flConcat] (tag);

    const [query, values] = tag2.compile ({});
    const [query2, values2] = tag3.compile ({});

    expect (query).toBe ("select id from player");

    expect (values).toEqual ([]);

    expect (query).toEqual (query2);
    expect (values).toEqual (values2);
  });

  test ("Functor", async () => {
    type Params = {id: number; prefix: string};

    const tag = sql<Params, any>`
      select first_name, last_name, 
      concat (${p => p.prefix}::text, '-', last_name) as prefixed_name
      from player
      ${sql<{id: number}, any>`
        where id = ${p => p.id} 
      `}
    `;

    const params: Params = {
      id: 1,
      prefix: "player"
    };

    const [player1] = await tag (params, querier);
    const [player2] = await tag[flMap] (x => x) (params, querier);

    expect (player1).toEqual (player2);

    const first = (rows: any[]) =>
      rows[0];

    const toUpperPrefix = (row: any) => ({
      ...row,
      prefixed_name: row.prefixed_name.toUpperCase ()
    });

    const player3 = await tag[flMap] (rows => toUpperPrefix (first (rows))) (params, querier);
    const player4 = await tag[flMap] (first)[flMap] (toUpperPrefix) (params, querier);

    expect (player3).toEqual (player4);

    expect (player3.prefixed_name.startsWith ("PLAYER-")).toBe (true);
  });

  test ("Contravariant", async () => {
    type Params = {id: number; prefix: string};

    const tag = sql<Params, any>`
      select first_name, last_name, 
      concat (${p => p.prefix}::text, '-', last_name) as prefixed_name
      from player
      ${sql<{id: number}, any>`
        where id = ${p => p.id} 
      `}
    `;

    const params: Params = {
      id: 1,
      prefix: " player "
    };

    const [player1] = await tag (params, querier);
    const [player2] = await tag[flContramap] (x => x) (params, querier);

    expect (player1).toEqual (player2);

    const trim = (p: Params): Params => ({
      id: p.id,
      prefix: p.prefix.trim ()
    });

    const toUpper = (p: Params): Params => ({
      id: p.id,
      prefix: p.prefix.toUpperCase ()
    });

    const [player3] = await tag[flContramap] (p => toUpper (trim (p))) (params, querier);
    const [player4] = await tag[flContramap] (trim)[flContramap] (toUpper) (params, querier);

    expect (player3).toEqual (player4);

    expect (player3.prefixed_name.startsWith ("PLAYER-")).toBe (true);
  });


  test ("run", async () => {
    type Params = {
      limit: number;
    };

    const limit = sql<Params, any>`limit ${p => p.limit}`;

    const tag = sql<Params, any>`
      select id, first_name, ${rawLastName}, (${sql`
      select count(*) from goal where player_id = player.id`}) number_of_goals
      from ${player}
      ${limit}
      offset 1
    `;

    const params = { limit: 5 };

    const [query, values] = tag.compile (params);

    expect (query).toBe (format (`
      select id, first_name, last_name, (select count(*) from goal where player_id = player.id) number_of_goals
      from player
      limit $1
      offset 1
    `));

    expect (values).toEqual ([5]);

    const players = await tag (params, querier);

    expect (Object.keys (players[0])).toEqual (["id", "first_name", "last_name", "number_of_goals"]);
    expect (players.length).toBe (5);
  });


  test ("Values", async () => {
    const tag = sql<{ids: number[]}, Player[]>`
      select id, first_name, ${rawLastName}
      from player
      where id in ${Values (p => p.ids)}
    `;

    const spy = jest.spyOn (tag, "interpret");

    const [query, values] = tag.compile ({ ids: [3, 4] });

    expect (query).toBe (format (`
      select id, first_name, last_name
      from player
      where id in ($1, $2)
    `));

    expect (values).toEqual ([3, 4]);

    const [query2, values2] = tag.compile ({ ids: [3, 4, 5] });

    // using cache
    expect (spy).toBeCalledTimes (1);

    expect (query2).toBe (format (`
      select id, first_name, last_name
      from player
      where id in ($1, $2, $3)
    `));

    expect (values2).toEqual ([3, 4, 5]);

    const players = await tag ({ ids: [3, 4] }, querier);

    expect (players[0].id).toBe (3);
    expect (players[1].id).toBe (4);
    expect (players.length).toBe (2);
  });

  test ("insert", async () => {
    const isPG = process.env.DB_TYPE === "pg";
    let cars = '["Mercedes", "volvo"]';

    if (isPG) {
      cars = JSON.parse (cars);
    }

    const insert = sql<{fields: string[]; table: Table; data: StringMap}, any>`
      insert into ${Raw (p => `${p.table} (${p.fields.join (", ")})`)}
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

    await insert (params, querier);

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

    const players = await returning ({}, querier);

    expect (players[0].first_name).toBe ("John");
    expect (players[0].last_name).toBe ("Doe");
    expect (players[0].cars).toEqual (isPG ? cars : JSON.parse (cars));
    expect (players.length).toBe (1);
  });

  test ("insert multiple", async () => {
    const insert = sql<{fields: string[]; table: Table; data: StringMap[]}, any>`
      insert into ${Raw (p => `${p.table} (${p.fields.join (", ")})`)}
      values ${Values2D (p => p.data.map (x => p.fields.map (f => x[f])))}
    `;

    const params = {
      table: player, fields: ["first_name", "last_name"],
      data: [
        { first_name: "John", last_name: "Doe" },
        { first_name: "Jane", last_name: "Doe" },
        { first_name: "Jimmy", last_name: "Doe" }
      ]
    };

    const [query, values] = insert.compile (params);

    expect (query).toBe (format (`
      insert into player (first_name, last_name)
      values ($1, $2), ($3, $4), ($5, $6)
    `));

    expect (values).toEqual (["John", "Doe", "Jane", "Doe", "Jimmy", "Doe"]);

    await insert (params, querier);

    const returning = sql<{}, any>`
      select * from player
      order by id desc
      limit 3
    `;

    const players = await returning ({}, querier);

    expect (players[0].first_name).toBe ("Jimmy");
    expect (players[1].first_name).toBe ("Jane");
    expect (players[2].first_name).toBe ("John");
    expect (players.length).toBe (3);
  });

  test ("database error", async () => {
    const message = 'relation "playerr" does not exist';
    try {
      const tag = sql`
        select * from playerr
        where playerr.id = 1
      `;
      await tag ({}, () => Promise.reject (message));
    } catch (err: any) {
      expect (err).toBe (message);
    }
  });

  test ("when", () => {
    const tag = sql<{limit?: number; offset?: number}, any>`
      select id from player
      ${When (p => !!p.limit, sql`
        limit ${p => p.limit}
      `)} 
      ${When (p => !!p.offset, sql`
        offset ${p => p.offset}
      `)} 
    `;

    const [query, values] = tag.compile ({ limit: 5 });

    expect (query).toBe (format (`
      select id from player
      limit $1 
    `));

    expect (values).toEqual ([5]);

    const [query2, values2] = tag.compile ({ offset: 10 });

    expect (query2).toBe (format (`
      select id from player
      offset $1 
    `));

    expect (values2).toEqual ([10]);

    const [query3, values3] = tag.compile ({ limit: 5, offset: 10 });

    expect (query3).toBe (format (`
      select id from player
      limit $1 
      offset $2 
    `));

    expect (values3).toEqual ([5, 10]);
  });

  test ("nested when", () => {
    const tag = sql<{id?: number; limit?: number; offset?: number; orderBy?: string}, any>`
      select id from player
      ${When (p => !!p.id, sql`
        where id = ${p => p.id}
      `)}
      and 1 = 1
      ${When (p => !!p.orderBy, sql`
        order by ${Raw (p => p.orderBy)}
        ${When (p => !!p.limit, sql`
          limit ${p => p.limit}
          ${When (p => !!p.offset, sql`
            offset ${p => p.offset}
          `)} 
        `)}
      `)}
    `;

    const [query, values] = tag.compile ({ id: 1, orderBy: "last_name" });

    expect (query).toBe (format (`
      select id from player
      where id = $1
      and 1 = 1
      order by last_name
    `));

    expect (values).toEqual ([1]);

    const [query2, values2] = tag.compile ({ limit: 5 });

    expect (query2).toBe (format (`
      select id from player
      and 1 = 1
    `));

    expect (values2).toEqual ([]);

    const [query3, values3] = tag.compile ({ id: 1, orderBy: "last_name", limit: 5 });

    expect (query3).toBe (format (`
      select id from player
      where id = $1
      and 1 = 1
      order by last_name
      limit $2 
    `));

    expect (values3).toEqual ([1, 5]);

    const [query4, values4] = tag.compile ({ orderBy: "last_name", limit: 5, offset: 10 });

    expect (query4).toBe (format (`
      select id from player
      and 1 = 1
      order by last_name
      limit $1 
      offset $2
    `));

    expect (values4).toEqual ([5, 10]);
  });

  test ("no querier provided error", async () => {
    const message = "There was no Querier provided";
    try {
      const tag = sql`select * from player`;
      await tag ();
    } catch (err: any) {
      expect (err.message).toBe (message);
    }
  });

  test ("compile errors", () => {
    expect (() => sql`select ${player`id`}`.compile ({}))
      .toThrowError (new Error ("U can't use RQLTags inside SQLTags"));
  });

  test ("unimplemented", () => {

    expect (() => sql`select ${Identifier ("id")}`.compile ({}))
      .toThrowError (new Error ("Unimplemented by SQLTag: Identifier"));

    expect (() => sql`select ${RefNode (dummyRefInfo, dummy`*`, true)}`.compile ({}))
      .toThrowError (new Error ("Unimplemented by SQLTag: RefNode"));

    expect (() => sql`select ${BelongsToMany (dummyRefInfo, dummy`*`, true)}`.compile ({}))
      .toThrowError (new Error ("Unimplemented by SQLTag: BelongsToMany"));

    expect (() => sql`select ${all}`.compile ({}))
      .toThrowError (new Error ("Unimplemented by SQLTag: All"));

    expect (() => sql`select ${Variable (1)}`.compile ({}))
      .toThrowError (new Error ("Unimplemented by SQLTag: Variable"));

    expect (() => sql`select ${Call ("concat", [])}`.compile ({}))
      .toThrowError (new Error ("Unimplemented by SQLTag: Call"));

    expect (() => sql`select ${StringLiteral ("one")}`.compile ({}))
      .toThrowError (new Error ("Unimplemented by SQLTag: StringLiteral"));

    expect (() => sql`select ${Literal (1)}`.compile ({}))
      .toThrowError (new Error ("Unimplemented by SQLTag: Literal"));

    expect (() => sql`select ${Literal (true)}`.compile ({}))
      .toThrowError (new Error ("Unimplemented by SQLTag: Literal"));

    expect (() => sql`select ${Literal (null)}`.compile ({}))
      .toThrowError (new Error ("Unimplemented by SQLTag: Literal"));
  });
});