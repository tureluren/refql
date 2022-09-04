import { Pool } from "pg";
import SQLTag from ".";
import In from "../In";
import Raw from "../Raw";
import rql from "../RQLTag/rql";
import { Player } from "../soccer";
import querier from "../test/querier";
import userConfig from "../test/userConfig";
import sql from "./sql";

describe ("SQLTag type", () => {
  const pool = new Pool (userConfig);
  const rawLastName = Raw.of ("last_name");

  afterAll (async () => {
    await pool.end ();
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

    const players = await tag.run<Player> (querier (pool), { limit: 5, offset: 1 });

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
      expect (err.message).toBe ("You can't use RQL tags inside SQL Tags");
    }
  });
});