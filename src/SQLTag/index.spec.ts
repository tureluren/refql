import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import { convertSQLTagResult, createSQLTag, isSQLTag } from ".";
import { flConcat } from "../common/consts";
import { OnlyStringColProps, Querier, SQLTagVariable, StringMap } from "../common/types";
import When from "../common/When";
import Table from "../Table";
import format from "../test/format";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import { Player, Team } from "../test/tables";
import userConfig from "../test/userConfig";
import Raw from "./Raw";
import sql, { parse } from "./sql";
import Values from "./Values";
import Values2D from "./Values2D";

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

  const rawLastName = Raw ('last_name "lastName"');

  afterAll (() => {
    pool.end ();
  });

  test ("create SQLTag", () => {
    const nodes = [Raw ("select first_name, last_name"), Raw ("from player")];
    const tag = createSQLTag (nodes);

    expect (tag.nodes).toEqual (nodes);
    expect (tag.interpreted).toBe (undefined);
    expect (isSQLTag (tag)).toBe (true);
    expect (isSQLTag ({})).toBe (false);
  });

  test ("create sql with default querier", async () => {
    const sql2 = <Params = unknown, Output = unknown> (strings: TemplateStringsArray, ...variables: SQLTagVariable<Params>[]) => {
      const nodes = parse <Params, Output> (strings, variables);
      return createSQLTag<Params, Output> (nodes, querier);
    };

    const tag = sql2<{}, { id: number; first_name: string }[]>`
      select id, first_name,
    `;

    const tag2 = sql2<{}, { last_name: string }[]>`
      last_name
      from player
      limit 1
    `;

    const tag3 = tag.concat (tag2);

    const players = await tag3 ();

    expect (players.length).toBe (1);

    expect (Object.keys (players[0])).toEqual (["id", "first_name", "last_name"]);
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

    expect (query).toBe ('select id, last_name "lastName" from player where id = $1');

    expect (values).toEqual ([2]);

    expect (query).toEqual (query2);
    expect (values).toEqual (values2);
  });

  test ("Dynamic Table", async () => {
    const playerById = sql<{ id: number }, any[]>`
      select id, first_name from ${Player}
      where id = ${p => p.id}
    `;

    const [firstPlayer] = await playerById ({ id: 1 }, querier);

    expect (Object.keys (firstPlayer)).toEqual (["id", "first_name"]);
  });

  test ("Dynamic Table with schema", async () => {
    const teamById = sql<{ id: number }, any[]>`
      select id, name from ${Team}
      where id = ${p => p.id}
    `;

    const [query] = teamById.compile ({ id: 1 });

    expect (query).toBe (format (`
      select id, name
      from public.team
      where id = $1
    `));
    const [firstTeam] = await teamById ({ id: 1 }, querier);

    expect (Object.keys (firstTeam)).toEqual (["id", "name"]);
  });

  test ("Values", async () => {
    const tag = sql<{ids: number[]}, OnlyStringColProps<typeof Player["props"]>[]>`
      select id, first_name "firstName", ${rawLastName}
      from player
      where id in ${Values (p => p.ids)}
    `;

    const spy = jest.spyOn (tag, "interpret");

    const [query, values] = tag.compile ({ ids: [3, 4] });

    expect (query).toBe (format (`
      select id, first_name "firstName", last_name "lastName"
      from player
      where id in ($1, $2)
    `));

    expect (values).toEqual ([3, 4]);

    const [query2, values2] = tag.compile ({ ids: [3, 4, 5] });

    // using cache
    expect (spy).toBeCalledTimes (1);

    expect (query2).toBe (format (`
      select id, first_name "firstName", last_name "lastName"
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
      table: Player,
      fields: ["first_name", "last_name", "cars"],
      data: { first_name: "John", last_name: "Doe", cars }
    };

    const [query, values] = insert.compile (params as any);

    expect (query).toBe (format (`
      insert into player (first_name, last_name, cars)
      values ($1, $2, $3)
    `));

    expect (values).toEqual (["John", "Doe", cars]);

    await insert (params as any, querier);

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
      table: Player, fields: ["first_name", "last_name"],
      data: [
        { first_name: "John", last_name: "Doe" },
        { first_name: "Jane", last_name: "Doe" },
        { first_name: "Jimmy", last_name: "Doe" }
      ]
    };

    const [query, values] = insert.compile (params as any);

    expect (query).toBe (format (`
      insert into player (first_name, last_name)
      values ($1, $2), ($3, $4), ($5, $6)
    `));

    expect (values).toEqual (["John", "Doe", "Jane", "Doe", "Jimmy", "Doe"]);

    await insert (params as any, querier);

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
    expect (() => sql`select ${Player (["*"])}`.compile ({}))
      .toThrowError (new Error ("U can't use RQLTags inside SQLTags"));

    let tag = sql`select * from player`;
    tag.nodes = [1] as any;

    expect (() => tag.compile ({}))
      .toThrowError (new Error ('Unknown SQLNode Type: "1"'));
  });

  test ("convert result", async () => {
    const convert = jest.fn ();

    const id = (x: Promise<any>) => {
      convert ();
      return x;
    };

    convertSQLTagResult (id);
    const tag = sql`select * from player limit 1`;

    await tag ({}, querier);

    expect (convert).toBeCalledTimes (1);
  });
});