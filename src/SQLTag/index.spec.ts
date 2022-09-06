import { createPool } from "mysql2";
import { Pool } from "pg";
import SQLTag from ".";
import In from "../In";
import Raw from "../Raw";
import rql from "../RQLTag/rql";
import { Player } from "../soccer";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import userConfig from "../test/userConfig";
import { Querier } from "../types";
import sql from "./sql";

describe ("SQLTag type", () => {
  const pgPool = new Pool (userConfig ("pg"));
  const mySQLPool = createPool (userConfig ("mysql"));
  const rawLastName = Raw.of ("last_name");

  afterAll (async () => {
    await pgPool.end ();
    mySQLPool.end ();
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

    const testPlayers = async (querier: Querier<Player>) => {
      const players = await tag.run<Player> (querier, { limit: 5, offset: 1 });

      expect (Object.keys (players[0])).toEqual (["id", "first_name", "last_name"]);
      expect (players.length).toBe (5);
    };

    await testPlayers (pgQuerier (pgPool));
    await testPlayers (mySQLQuerier (mySQLPool));
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