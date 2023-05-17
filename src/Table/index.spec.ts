import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import Table from ".";
import { flEquals } from "../common/consts";
import { Querier } from "../common/types";
import numberProp from "../Prop/numberProp";
import stringProp from "../Prop/stringProp";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import { Player, Team } from "../test/tables";
import userConfig from "../test/userConfig";

describe ("Table type", () => {
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

  afterAll (() => {
    pool.end ();
  });

  test ("create Table", () => {
    const Player2 = Table ("public.player", []);
    expect (Player.name).toBe ("player");
    expect (Player.schema).toBe (undefined);
    expect (Player2.schema).toBe ("public");
    expect (`${Player}`).toBe ("player");
    expect (`${Player2}`).toBe ("public.player");
    expect (Table.isTable (Player)).toBe (true);
    expect (Table.isTable ({})).toBe (false);
  });

  test ("default querier", async () => {
    const Player2 = Table ("player", [
      numberProp ("id"),
      stringProp ("lastName", "last_name")
    ], querier);

    const firstPlayer = Player2 ([
      "id",
      "lastName",
      sql`
        limit 1 
      `
    ]);

    const players = await firstPlayer ({});

    expect (players.length).toBe (1);

    expect (Object.keys (players[0])).toEqual (["id", "lastName"]);
  });

  test ("Setoid", () => {
    expect (Player[flEquals] (Player)).toBe (true);
    expect (Player[flEquals] (Raw ("player") as any)).toBe (false);
    expect (Player[flEquals] (Team as any)).toBe (Team[flEquals] (Player as any));
    expect (Player[flEquals] (Player) && Player[flEquals] (Player)).toBe (Player[flEquals] (Player));
  });

  test ("errors", () => {
    expect (() => Table ("player", {} as any))
      .toThrowError (new Error ("Invalid props: not an Array"));

    expect (() => Table (1 as any, []))
      .toThrowError (new Error ("Invalid table: 1, expected a string"));
  });
});