import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import { createSQLTag, isSQLTag } from ".";
import { flConcat } from "../common/consts";
import { OnlyProps, Querier, StringMap } from "../common/types";
import format from "../test/format";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import userConfig from "../test/userConfig";
import Raw from "./Raw";
import makeSQL from "./sql";
import Values from "./Values";
import Values2D from "./Values2D";
import makeTestTables from "../test/tables";
import RefQL from "../RefQL";
import dummyQuerier from "../common/dummyQuerier";
import { Table } from "../Table";
import defaultRunner from "../common/defaultRunner";

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


  const { Table, sql, options } = RefQL ({ querier });

  const {
    Player, Team
  } = makeTestTables (Table, sql);

  const rawLastName = Raw ('last_name "lastName"');

  afterAll (() => {
    pool.end ();
  });

  test ("create SQLTag", () => {
    const nodes = [Raw ("select first_name, last_name"), Raw ("from player")];
    const tag = createSQLTag (nodes, options);

    expect (tag.nodes).toEqual (nodes);
    expect (tag.interpreted).toBe (undefined);
    expect (isSQLTag (tag)).toBe (true);
    expect (isSQLTag ({})).toBe (false);
  });

  test ("join", () => {
    const tag = sql``;

    const tag2 = sql`
      select *
    `;

    const tag3 = sql``;

    const tag4 = sql`
      from player
    `;

    const joined = tag.join (" ", tag2).join (" ", tag3).join (" ", tag4);

    const [query] = joined.compile ({});

    expect (query).toBe (" select *  from player");
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

  test ("Concat with empty", () => {
    const tag = sql``;

    const tag2 = sql`
      select id, last_name from player where id = 1
    `;

    const tag3 = sql``;

    const [query] = tag.concat (tag2).concat (tag3).compile ({});

    expect (query).toBe ("select id, last_name from player where id = 1");
  });

  test ("Dynamic Table", async () => {
    const playerById = sql<{ id: number }, any[]>`
      select id, first_name from ${Player}
      where id = ${p => p.id}
    `;

    const [firstPlayer] = await playerById ({ id: 1 });

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
    const [firstTeam] = await teamById ({ id: 1 });

    expect (Object.keys (firstTeam)).toEqual (["id", "name"]);
  });

  test ("Values", async () => {
    const tag = sql<{ids: number[]}, OnlyProps<typeof Player["props"]>>`
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

    const players = await tag ({ ids: [3, 4] });

    expect (players[0].id).toBe (3);
    expect (players[1].id).toBe (4);
    expect (players.length).toBe (2);
  });

  test ("insert", async () => {
    const isPG = !process.env.DB_TYPE || process.env.DB_TYPE === "pg";
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

    const [query, values] = insert.compile (params);

    expect (query).toBe (format (`
      insert into player (first_name, last_name, cars)
      values ($1, $2, $3)
    `));

    expect (values).toEqual (["John", "Doe", cars]);

    await insert (params);

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

    const players = await returning ({});

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

    const [query, values] = insert.compile (params);

    expect (query).toBe (format (`
      insert into player (first_name, last_name)
      values ($1, $2), ($3, $4), ($5, $6)
    `));

    expect (values).toEqual (["John", "Doe", "Jane", "Doe", "Jimmy", "Doe"]);

    await insert (params);

    const returning = sql<{}, any>`
      select * from player
      order by id desc
      limit 3
    `;

    const players = await returning ({});

    expect (players[0].first_name).toBe ("Jimmy");
    expect (players[1].first_name).toBe ("Jane");
    expect (players[2].first_name).toBe ("John");
    expect (players.length).toBe (3);
  });

  test ("database error", async () => {
    const message = 'relation "playerr" does not exist';
    try {
      const tag = makeSQL ({ ...options, querier: () => Promise.reject (message) })`
        select * from playerr
        where playerr.id = 1
      `;
      await tag ({});
    } catch (err: any) {
      expect (err).toBe (message);
    }
  });

  test ("compile errors", () => {
    expect (() => sql`select ${Player ([])}`.compile ({}))
      .toThrowError (new Error ("U can't use RQLTags inside SQLTags"));

    let tag = sql`select * from player`;
    tag.nodes = [1] as any;

    expect (() => tag.compile ({}))
      .toThrowError (new Error ('Unknown SQLNode Type: "1"'));
  });

  test ("convert result", async () => {
    // const convert = jest.fn ();

    // const id = (x: Promise<any>) => {
    //   convert ();
    //   return x;
    // };

    // setConvertPromise (id);
    // const tag = sql`select * from player limit 1`;

    // await tag ({});

    // expect (convert).toBeCalledTimes (1);
  });
});