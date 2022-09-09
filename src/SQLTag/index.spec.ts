import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import SQLTag from ".";
import In from "../In";
import Raw from "../Raw";
import rql from "../RQLTag/rql";
import { Player } from "../soccer";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import userConfig from "../test/userConfig";
import { Querier } from "../types";
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

  const rawLastName = Raw.of ("last_name");

  const inc = (values: any[]) => values.map (x => x + 1);
  const mult = (values: any[]) => values.map (x => x * x);
  const limit = (strings: string[]) => strings.concat ("limit 10");
  const offset = (strings: string[]) => strings.concat ("offset 0");

  afterAll (() => {
    pool.end ();
  });

  test ("create SQLTag", () => {
    const strings = ["where id =", "order by last_name"];
    const keys = [1];
    const sqlTag = SQLTag.of (strings as any, keys);

    expect (sqlTag.strings).toEqual (strings);
    expect (sqlTag.values).toEqual (keys);
  });

  test ("Semigroup", () => {
    const tag = sql`select id, ${rawLastName}`;
    const tag2 = sql`from player`;
    const tag3 = sql`where id = ${1}`;

    const res = tag.concat (tag2).concat (tag3);
    const res2 = tag.concat (tag2.concat (tag3));

    expect (res).toEqual (res2);
    expect (res.values).toEqual ([rawLastName, 1]);
    expect (res.strings).toEqual (["select id,", "from player where id =", ""]);
  });

  test ("Functor", () => {
    const tag = sql`select * from player where id = ${1}`;

    expect (tag.map (v => v)).toEqual (tag);

    expect (tag.map (v => mult (inc (v))))
      .toEqual (tag.map (inc).map (mult));
  });

  test ("Functor left", () => {
    const tag = sql`select * from player`;

    expect (tag.mapLeft (s => s)).toEqual (tag);


    expect (tag.mapLeft (s => offset (limit (s))))
      .toEqual (tag.mapLeft (limit).mapLeft (offset));
  });

  test ("Bifunctor", () => {
    const tag = sql`select * from player where id > ${1}`;

    expect (tag.bimap (s => s, v => v)).toEqual (tag);

    expect (tag.bimap (s => offset (limit (s)), v => mult (inc (v))))
      .toEqual (tag.bimap (limit, inc).bimap (offset, mult));
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
      where id not ${In.of ([1, 2, 3])}
      ${paginate}
    `;

    const players = await tag.run<Player> (querier, { limit: 5, offset: 1 });

    expect (Object.keys (players[0])).toEqual (["id", "first_name", "last_name"]);
    expect (players.length).toBe (5);

  });

  test ("errors", async () => {
    try {
      const tag = sql`
        select ${rql`player { * }`}      
      `;
      await tag.run (() => Promise.resolve ([]), {});
    } catch (err: any) {
      expect (err.message).toBe ("You can't use RQL Tags inside SQL Tags");
    }
  });
});