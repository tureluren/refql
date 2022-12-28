import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import SQLTag from ".";
import { flConcat, flEmpty, flMap } from "../common/consts";
import { Querier, StringMap } from "../common/types";
import { all, BelongsTo, BelongsToMany, BooleanLiteral, Call, HasMany, HasOne, Identifier, Literal, NullLiteral, NumericLiteral, Raw, StringLiteral, Values, Values2D, Variable } from "../nodes";
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

    const [query, values] = tag4.compile ();
    const [query2, values2] = tag5.compile ();

    expect (query).toBe ("select id, last_name from player where id = $1");

    expect (values).toEqual ([2]);

    expect (query).toEqual (query2);
    expect (values).toEqual (values2);
  });

  test ("Monoid", () => {
    const tag = sql`select id from player`;

    const tag2 = tag[flConcat] (SQLTag[flEmpty] ());
    const tag3 = SQLTag[flEmpty] ()[flConcat] (tag);

    const [query, values] = tag2.compile ();
    const [query2, values2] = tag3.compile ();

    expect (query).toBe ("select id from player");

    expect (values).toEqual ([]);

    expect (query).toEqual (query2);
    expect (values).toEqual (values2);
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
    };

    const limit = sql<Params>`limit ${p => p.limit}`;

    const tag = sql<Params>`
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

    const players = await tag.run<Player> (querier, params);

    expect (Object.keys (players[0])).toEqual (["id", "first_name", "last_name", "number_of_goals"]);
    expect (players.length).toBe (5);
  });


  test ("Values", async () => {
    const tag = sql<{ids: number[]}>`
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

    const players = await tag.run<Player> (querier, { ids: [3, 4] });

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

    const insert = sql<{fields: string[]; table: Table; data: StringMap}>`
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

    await insert.run (querier, params);

    let returning = sql<{}>`
      select * from player
      where cars = CAST(${cars} as json)
      order by id desc
      limit 1
    `;

    if (isPG) {
      returning = sql<{}>`
        select * from player
        where cars = ${cars}
        order by id desc
        limit 1
      `;
    }

    const players = await returning.run<any> (querier);

    expect (players[0].first_name).toBe ("John");
    expect (players[0].last_name).toBe ("Doe");
    expect (players[0].cars).toEqual (isPG ? cars : JSON.parse (cars));
    expect (players.length).toBe (1);
  });

  test ("insert multiple", async () => {
    const insert = sql<{fields: string[]; table: Table; data: StringMap[]}>`
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

    await insert.run (querier, params);

    const returning = sql<{}>`
      select * from player
      order by id desc
      limit 3
    `;

    const players = await returning.run<any> (querier);

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
      await tag.run (() => Promise.reject (message));
    } catch (err: any) {
      expect (err).toBe (message);
    }
  });

  test ("compile errors", () => {
    expect (() => sql`select ${player`id`}`.compile ())
      .toThrowError (new Error ("U can't use RQLTags inside SQLTags"));
  });

  test ("unimplemented", () => {

    expect (() => sql`select ${Identifier ("id")}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: Identifier"));

    expect (() => sql`select ${BelongsTo (dummyRefInfo, dummy`*`)}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: BelongsTo"));

    expect (() => sql`select ${BelongsToMany (dummyRefInfo, dummy`*`)}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: BelongsToMany"));

    expect (() => sql`select ${HasOne (dummyRefInfo, dummy`*`)}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: HasOne"));

    expect (() => sql`select ${HasMany (dummyRefInfo, dummy`*`)}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: HasMany"));

    expect (() => sql`select ${all}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: All"));

    expect (() => sql`select ${dummyRefInfo.lRef}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: Ref"));

    expect (() => sql`select ${Variable (1)}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: Variable"));

    expect (() => sql`select ${Call ("concat", [])}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: Call"));

    expect (() => sql`select ${StringLiteral ("one")}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: StringLiteral"));

    expect (() => sql`select ${Literal (1)}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: Literal"));

    expect (() => sql`select ${Literal (true)}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: Literal"));

    expect (() => sql`select ${Literal (null)}`.compile ())
      .toThrowError (new Error ("Unimplemented by SQLTag: Literal"));
  });
});