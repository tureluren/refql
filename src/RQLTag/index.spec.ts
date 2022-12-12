import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import RQLTag from ".";
import { flConcat, flMap } from "../common/consts";
import { Querier } from "../common/types";
import { all, Identifier, Root } from "../nodes";
import Raw from "../Raw";
import { Player } from "../soccer";
import sql from "../SQLTag/sql";
import Table from "../Table";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import { game, goal, league, player, rating, team } from "../test/tables";
import userConfig from "../test/userConfig";

describe ("RQLTag type", () => {
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

  test ("create RQLTag", () => {
    const tag = RQLTag (player, []);

    expect (tag.nodes).toEqual ([]);
    expect (RQLTag.isRQLTag (tag)).toBe (true);
    expect (RQLTag.isRQLTag ({})).toBe (false);
  });

  test ("compile", async () => {
    // const tag = player`
    //   id
    //   first_name
    //   last_name
    //   concat:full_name(first_name, ${Raw ("'  '")}, last_name)
    //   ${team`
    //     id
    //     name
    //   `}
    //   ${rating`
    //     *
    //   `}
    // `;

    const tag = player`
      id
      first_name
      last_name 
      concat:full_name(upper(first_name), ${Raw ("' '")}, last_name)
      ${team`
        id
        name 
      `}
      ${rating`
        *
      `}
      ${goal`
        *
      `}
      ${game`
        *
      `
      }
      ${sql`
        limit ${20}
      `}
    `;

    const compiled = tag.compile ({});

    const players = await tag.run (querier, {});

    console.log (players[9]);
  });

  // test ("Semigroup", () => {
  //   const tag = player`id`;
  //   const tag2 = player`first_name last_name`;
  //   const tag3 = player`team_id position_id`;

  //   const res = tag[flConcat] (tag2)[flConcat] (tag3);
  //   const res2 = tag[flConcat] (tag2[flConcat] (tag3));

  //   const expected = Root (
  //     Table ("player"),
  //     [Identifier ("id"), Identifier ("first_name"), Identifier ("last_name"), Identifier ("team_id"), Identifier ("position_id")]
  //   );

  //   expect (res).toEqual (res2);
  //   expect (JSON.stringify (res.node)).toEqual (JSON.stringify (expected));
  // });

  // test ("Monoid", () => {
  //   const tag = player`id last_name`;

  //   expect (tag.concat (player.empty ())).toEqual (tag);
  //   expect (player.empty ().concat (tag)).toEqual (tag);
  // });

  // test ("Functor", () => {
  //   const tag = RQLTag (Root (player, [Identifier ("first_name"), Identifier ("last_name")]));

  //   expect (tag[flMap] (n => n)).toEqual (tag);

  //   const prefix = (node: any) => {
  //     return Object.assign (
  //       node,
  //       {
  //         members: node.members.map ((identifier: Identifier) =>
  //           Identifier (`player_${identifier.name}`))
  //       }
  //     );
  //   };

  //   const toUpper = (node: any) => {
  //     return Object.assign (
  //       node,
  //       {
  //         members: node.members.map ((identifier: Identifier) =>
  //           Identifier (identifier.name.toUpperCase ()))
  //       }
  //     );
  //   };

  //   expect (tag[flMap] (n => toUpper (prefix (n))))
  //     .toEqual (tag[flMap] (prefix)[flMap] (toUpper));
  // });

  // test ("errors", async () => {
  //   const id = Identifier ("id");

  //   expect (() => (RQLTag as any) (id))
  //     .toThrowError (new Error ("RQLTag should hold a Root node"));

  //   expect (() => player`id`.concat (team`id`))
  //     .toThrowError (new Error ("U can't concat RQLTags with a different root table"));

  //   try {
  //     const tag = RQLTag (Root (player, []));
  //     (tag as any).node = id;

  //     await tag.run (() => Promise.resolve ([]), undefined);
  //   } catch (err: any) {
  //     expect (err.message).toBe ("You can only run a RQLTag that holds a Root node");
  //   }

  //   try {
  //     const tag = RQLTag (Root (player, []));
  //     delete (tag as any).node.table;

  //     await tag.run (() => Promise.resolve ([]), {});
  //   } catch (err: any) {
  //     expect (err.message).toBe ("The Root node has no table");
  //   }
  // });

  // test ("aggregate", async () => {
  //   const tag = player`
  //     id
  //     first_name
  //     ${player`
  //       last_name
  //     `}
  //     ${team`
  //       name
  //       ${league`
  //         name
  //       `}
  //       ${player`
  //         last_name
  //       `}: players
  //     `}
  //     ${game`
  //       result
  //     `}: games
  //     ${rating`
  //       acceleration
  //       stamina
  //     `}
  //     ${sql`
  //       limit 30
  //     `}
  //   `;

  //   const players = await tag.run<Player> (querier, {});
  //   const player1 = players[0];
  //   const playerTeam = player1.team;
  //   const teammate = playerTeam.players[0];
  //   const teamLeague = player1.team.league;
  //   const playerGame = player1.games[0];
  //   const playerRating = player1.rating;

  //   expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "team", "games", "rating"]);
  //   expect (Object.keys (playerTeam)).toEqual (["name", "league", "players"]);
  //   expect (Object.keys (teamLeague)).toEqual (["name"]);
  //   expect (Object.keys (teammate)).toEqual (["last_name"]);
  //   expect (Object.keys (playerGame)).toEqual (["result"]);
  //   expect (Object.keys (playerRating)).toEqual (["acceleration", "stamina"]);
  //   expect (players.length).toBe (30);
  // });

  // test ("simplistic", async () => {
  //   const tag = player`
  //     ${team}
  //     ${game}
  //     ${sql`
  //       limit 30
  //     `}
  //   `;

  //   const players = await tag.run<Player> (querier, {});
  //   const player1 = players[0];
  //   const playerTeam = player1.team;
  //   const playerGame = player1.games[0];

  //   expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "cars", "birthday", "team_id", "position_id", "team", "games"]);
  //   expect (Object.keys (playerTeam)).toEqual (["id", "name", "league_id"]);
  //   expect (Object.keys (playerGame)).toEqual (["id", "home_team_id", "away_team_id", "league_id", "result"]);
  // });

  // test ("concat", async () => {
  //   const tag = player`
  //     id
  //     first_name
  //     ${team`
  //       name
  //     `}
  //   `;

  //   const tag2 = player`
  //     last_name
  //     ${sql`
  //       limit 30
  //     `}
  //   `;

  //   const players = await tag.concat (tag2).run<Player> (querier, {});
  //   const player1 = players[0];
  //   const playerTeam = player1.team;

  //   expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "team"]);
  //   expect (Object.keys (playerTeam)).toEqual (["name"]);
  //   expect (players.length).toBe (30);
  // });

  // test ("By id", async () => {
  //   const tag = player`
  //     *
  //     ${sql`
  //       where ${Raw ((_p, t) => t!.name)}.id = 1
  //     `}
  //   `;

  //   const players = await tag.run<Player> (querier, {});
  //   const player1 = players[0];

  //   expect (player1.id).toBe (1);
  //   expect (players.length).toBe (1);
  // });

  // test ("No record found", async () => {
  //   const tag = player`
  //     ${goal`
  //       *
  //     `}
  //     ${sql`
  //       where player.id = 999999999
  //     `}
  //   `;

  //   const players = await tag.run<Player> (querier, {});

  //   expect (players.length).toBe (0);
  // });
});