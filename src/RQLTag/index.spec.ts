import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import RQLTag from ".";
import { All, HasMany, Identifier, Root } from "../Parser/nodes";
import { Player } from "../soccer";
import Table from "../Table";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import userConfig from "../test/userConfig";
import { Querier, TableNode } from "../types";
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

  const player = Table.of ("player");

  afterAll (() => {
    pool.end ();
  });

  test ("create RQLTag", () => {
    const node = Root.of (player, [All.of ("*")], {});
    const tag = RQLTag.of (node);

    expect (tag.node).toEqual (node);
  });

  test ("Functor", () => {
    const tag = RQLTag.of (Root.of (player, [All.of ("*")], {}));

    expect (tag.map (n => n)).toEqual (tag);

    const addTeam = <Params> (node: TableNode<Params>) =>
      node.addMember (HasMany.of (node.table, node.members, node.keywords));

    const addLastName = <Params> (node: TableNode<Params>) =>
      node.addMember (Identifier.of ("last_name"));

    expect (tag.map (n => addLastName (addTeam (n))))
      .toEqual (tag.map (addTeam).map (addLastName));
  });

  test ("errors", async () => {
    const id = Identifier.of ("id");

    expect (() => (RQLTag as any).of (id))
      .toThrowError (new Error ("RQLTag should hold a Root node"));

    try {
      const tag = RQLTag.of (Root.of (player, [], {}));
      (tag as any).node = id;

      await tag.run (() => Promise.resolve ([]), {});
    } catch (err: any) {
      expect (err.message).toBe ("You can only run a RQLTag that holds a Root node");
    }

    try {
      const tag = RQLTag.of (Root.of (player, [], {}));
      delete (tag as any).node.table;

      await tag.run (() => Promise.resolve ([]), {});
    } catch (err: any) {
      expect (err.message).toBe ("The Root node has no table");
    }
  });

  test ("aggregate", async () => {
    const tag = rql`
      player (limit: 30) { 
        last_name
        - team { 
          name
          - league { name }
          < player: players {
            last_name
          }
        }
        x game:games { 
          result 
        }
      }
    `;

    const players = await tag.run<Player> (querier, {});
    const player = players[0];
    const team = players[0].team;
    const teammate = team.players[0];
    const league = players[0].team.league;
    const game = players[0].games[0];

    expect (Object.keys (player)).toEqual (["last_name", "team", "games"]);
    expect (Object.keys (team)).toEqual (["name", "league", "players"]);
    expect (Object.keys (league)).toEqual (["name"]);
    expect (Object.keys (teammate)).toEqual (["last_name"]);
    expect (Object.keys (game)).toEqual (["result"]);
    expect (players.length).toBe (30);
  });
});