import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import RQLTag from ".";
import { flMap } from "../common/consts";
import { Querier } from "../common/types";
import { All, HasMany, Identifier, Root } from "../nodes";
import { Player } from "../soccer";
import sql from "../SQLTag/sql";
import Table from "../Table";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import { Game, Goal, League, Player as player, Team } from "../test/tables";
import userConfig from "../test/userConfig";
import rql from "./rql";

describe ("RQLTag type", () => {
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

  afterAll (() => {
    pool.end ();
  });

  test ("create RQLTag", () => {
    const node = Root (player, [All ("*")]);
    const tag = RQLTag (node);

    expect (tag.node).toEqual (node);
    expect (RQLTag.isRQLTag (tag)).toBe (true);
    expect (RQLTag.isRQLTag ({})).toBe (false);
  });

  test ("Functor", () => {
    const tag = RQLTag (Root (player, [Identifier ("first_name"), Identifier ("last_name")]));

    expect (tag[flMap] (n => n)).toEqual (tag);

    const prefix = (node: any) => {
      return Object.assign (
        node,
        {
          members: node.members.map ((identifier: Identifier) =>
            Identifier (`player_${identifier.name}`))
        }
      );
    };

    const toUpper = (node: any) => {
      return Object.assign (
        node,
        {
          members: node.members.map ((identifier: Identifier) =>
            Identifier (identifier.name.toUpperCase ()))
        }
      );
    };

    expect (tag[flMap] (n => toUpper (prefix (n))))
      .toEqual (tag[flMap] (prefix)[flMap] (toUpper));
  });

  // test ("errors", async () => {
  //   const id = Identifier ("id");

  //   expect (() => (RQLTag as any) (id))
  //     .toThrowError (new Error ("RQLTag should hold a Root node"));

  //   try {
  //     const tag = RQLTag (Root (player, [], {}));
  //     (tag as any).node = id;

  //     await tag.run (() => Promise.resolve ([]), undefined);
  //   } catch (err: any) {
  //     expect (err.message).toBe ("You can only run a RQLTag that holds a Root node");
  //   }

  //   try {
  //     const tag = RQLTag (Root (player, [], {}));
  //     delete (tag as any).node.table;

  //     await tag.run (() => Promise.resolve ([]), {});
  //   } catch (err: any) {
  //     expect (err.message).toBe ("The Root node has no table");
  //   }
  // });

  test ("aggregate", async () => {
    const tag = player`
      last_name
      ${Team`
        name
        ${League`
          name 
        `}
        ${player`
          last_name 
        `}: players
      `}
      ${Game`
        result 
      `}: games
      ${sql`
        limit 30 
      `}
    `;

    const players = await tag.run<Player> (querier, {});
    const player1 = players[0];
    const team = player1.team;
    const teammate = team.players[0];
    const league = player1.team.league;
    const game = player1.games[0];

    expect (Object.keys (player1)).toEqual (["last_name", "team", "games"]);
    expect (Object.keys (team)).toEqual (["name", "league", "players"]);
    expect (Object.keys (league)).toEqual (["name"]);
    expect (Object.keys (teammate)).toEqual (["last_name"]);
    expect (Object.keys (game)).toEqual (["result"]);
    expect (players.length).toBe (30);
  });

  test ("No record found", async () => {
    const tag = player`
      ${Goal`
        * 
      `}
      ${sql`
        where player.id = 999999999
      `}
    `;

    const players = await tag.run<Player> (querier, {});

    expect (players.length).toBe (0);
  });
});