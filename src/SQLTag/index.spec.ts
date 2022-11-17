import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import SQLTag from ".";
import { flConcat, flMap } from "../common/consts";
import { Querier } from "../common/types";
import In from "../In";
import Insert from "../Insert";
import { Variable } from "../nodes";
import Raw from "../Raw";
import rql from "../RQLTag/rql";
import Select from "../Select";
import { Player } from "../soccer";
import Table from "../Table";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import userConfig from "../test/userConfig";
import Update from "../Update";
import sql from "./sql";

describe ("SQLTag type", () => {
  let pool: any;
  let querier: Querier<Player>;

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
    const values = ["where id =", Variable (1), "order by last_name"];
    const tag = SQLTag (values);

    expect (tag.values).toEqual (values);
    expect (SQLTag.isSQLTag (tag)).toBe (true);
    expect (SQLTag.isSQLTag ({})).toBe (false);
  });

  test ("Semigroup", () => {
    const tag = sql`select id, ${rawLastName}`;
    const tag2 = sql`from player`;
    const tag3 = sql`where id = ${1}`;

    const res = tag[flConcat] (tag2)[flConcat] (tag3);
    const res2 = tag[flConcat] (tag2[flConcat] (tag3));

    expect (res).toEqual (res2);
    expect (res.values).toEqual (
      ["select id,", Variable (rawLastName), "from player", "where id =", Variable (1)]
    );
  });

  test ("Monoid", () => {
    const tag = sql`select id from player`;

    expect (tag.concat (SQLTag.empty ())).toEqual (tag);
    expect (SQLTag.empty ().concat (tag)).toEqual (tag);
  });

  test ("Functor", () => {
    const tag = sql`select * from player where id = ${1}`;

    const limit = (values: any[]) => values.concat ("limit 10");
    const offset = (values: any[]) => values.concat ("offset 0");

    expect (tag[flMap] (v => v)).toEqual (tag);

    expect (tag[flMap] (v => offset (limit (v))))
      .toEqual (tag[flMap] (limit)[flMap] (offset));
  });

  test ("run", async () => {
    type Params = {
      limit: number;
      offset: number;
    };

    const paginate = sql<Params>`
      limit ${p => p.limit}
      offset ${p => p.offset}
    `;

    const tag = sql<Params>`
      select id, first_name, ${rawLastName}
      from player
      where id not ${In ([1, 2, 3])}
      ${paginate}
    `;

    const players = await tag.run<Player> (querier, { limit: 5, offset: 1 });

    expect (Object.keys (players[0])).toEqual (["id", "first_name", "last_name"]);
    expect (players.length).toBe (5);

  });

  test ("errors", async () => {
    try {
      const tag = sql`
        select ${Table ("player")`id`}
      `;
      await tag.run (() => Promise.resolve ([]), undefined);
    } catch (err: any) {
      expect (err.message).toBe ("You can't use RQL Tags inside SQL Tags");
    }
  });

  test ("select", async () => {
    const tag = sql<{ limit: number; offset: number}>`
      ${Select (Table ("player"), ["first_name", "last_name"])}
      limit ${p => p.limit}
      offset ${p => p.offset}
    `;

    const players = await tag.run<Player> (querier, { limit: 5, offset: 1 });

    expect (Object.keys (players[0])).toEqual (["first_name", "last_name"]);
  });

  test ("insert", async () => {
    const tag = sql`
      ${Insert (Table ("goal"), ["game_id", "player_id", "minute"], [{ game_id: 1, player_id: 2, minute: 75 }])}
      returning *
    `;

    const goals: any[] = await tag.run<Player> (querier, {});

    expect (goals.length).toBe (1);
    expect (goals[0].game_id).toBe (1);
    expect (goals[0].player_id).toBe (2);
    expect (goals[0].minute).toBe (75);
  });

  test ("insert multiple", async () => {
    const tag = sql`
      ${Insert (Table ("goal"), ["game_id", "player_id", "minute"], [{ game_id: 1, player_id: 2, minute: 75 }, { game_id: 1, player_id: 9, minute: 85 }])}
      returning *
    `;

    const goals: any[] = await tag.run<Player> (querier, {});

    expect (goals.length).toBe (2);
    expect (goals[0].game_id).toBe (1);
    expect (goals[0].player_id).toBe (2);
    expect (goals[0].minute).toBe (75);
    expect (goals[1].game_id).toBe (1);
    expect (goals[1].player_id).toBe (9);
    expect (goals[1].minute).toBe (85);
  });

  test ("update", async () => {
    const tag = sql`
      ${Update (Table ("player"), ["first_name", "last_name"], { first_name: "John", last_name: "Doe" })}
      where id = 1
    `;

    await tag.run<Player> (querier, {});

    const [updated] = await sql`
      select first_name, last_name from player
      where id = 1
    `.run<any> (querier, {});

    expect (updated.first_name).toBe ("John");
    expect (updated.last_name).toBe ("Doe");
  });
});