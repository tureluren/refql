import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import RQLTag from ".";
import { flConcat, flEmpty, flMap } from "../common/consts";
import { Querier } from "../common/types";
import { Identifier, Value } from "../nodes";
import Raw from "../Raw";
import { Player } from "../soccer";
import sql from "../SQLTag/sql";
import format from "../test/format";
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
    expect (tag.table.equals (player)).toBe (true);
    expect (RQLTag.isRQLTag (tag)).toBe (true);
    expect (RQLTag.isRQLTag ({})).toBe (false);
  });

  test ("call", async () => {
    const tag = player<{}, Player>`
      concat:full_name (upper (last_name), " ", first_name)
      ${sql`limit 1`}
    `;

    const [query, values] = tag.compile ();

    expect (query).toBe (format (`
      select concat (upper (player.last_name), ' ', player.first_name) full_name
      from player
      limit 1
    `));

    expect (values).toEqual ([]);

    const [player1] = await tag.run (querier);

    expect (Object.keys (player1)).toEqual (["full_name"]);
  });

  test ("merge variable of same table", async () => {
    const tag = player<{}, Player>`
      id
      first_name
      ${player`
        last_name 
      `} 
      ${sql`where player.id = 1`} 
      ${player`
        team_id
        ${sql`order by ${Raw ((_p, t) => `${t}`)}.last_name`}
      `}
    `;

    const [query, values] = tag.compile ();

    expect (query).toBe (format (`
      select player.id, player.first_name, player.last_name, player.team_id
      from player
      where player.id = 1
      order by player.last_name
    `));

    expect (values).toEqual ([]);

    const [player1] = await tag.run (querier);

    expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "team_id"]);
  });

  test ("literals", async () => {
    const tag = player<{}, Player>`
      "1":one::int
      2:two::text
      true:t::text
      false:f::text
      null:n::text
      ${sql`limit 1`}
    `;

    const [query, values] = tag.compile ();

    expect (query).toBe (format (`
      select '1'::int one, 2::text two, true::text t, false::text f, null::text n
      from player
      limit 1
    `));

    expect (values).toEqual ([]);

    const [player1] = await tag.run (querier);

    expect (player1).toEqual ({ one: 1, two: "2", t: "true", f: "false", n: null });
  });

  //   // test ("parser errors", () => {
  //   //   expect (() => player`id, last_name`)
  //   //     .toThrowError (new SyntaxError ('Unknown Member Type: ","'));

  //   //   expect (() => player`concat(*)`)
  //   //     .toThrowError (new SyntaxError ('Unknown Argument Type: "*"'));

  //   //   expect (() => player`concat(${player})`)
  //   //     .toThrowError (new SyntaxError ("U can't use a Table as a function argument"));

  //   //   expect (() => player`concat(${player``})`)
  //   //     .toThrowError (new SyntaxError ("U can't use a RQLTag as a function argument"));

  //   //   expect (() => player`${league`*`}`)
  //   //     .toThrowError (new SyntaxError ("player has no ref defined for: league"));

  //   //   expect (() => player`${["name"]}`)
  //   //     .toThrowError (new SyntaxError ("Invalid dynamic members, expected Array of ASTNode"));

  //   //   expect (() => player`${[all]} last_name`)
  //   //     .toThrowError (new SyntaxError ('Unexpected token: "last_name", expected: "EOT"'));

  //   //   const parser = new Parser ("*", [], player);
  //   //   parser.lookahead = { type: "DOUBLE" as TokenType, value: "3.14" };

  //   //   expect (() => parser.Literal ())
  //   //     .toThrowError (new SyntaxError ('Unknown Literal: "DOUBLE"'));
  //   // });

  test ("Semigroup", () => {
    const tag = player`id`;
    const tag2 = player`first_name last_name`;
    const tag3 = player`team_id position_id`;

    const res = tag[flConcat] (tag2)[flConcat] (tag3);
    const res2 = tag[flConcat] (tag2[flConcat] (tag3));

    expect (res.compile ()).toEqual (res2.compile ());
  });

  test ("Monoid", () => {
    const tag = player`id last_name`;

    const res = tag[flConcat] (player.empty ());
    const res2 = player[flEmpty] ()[flConcat] (tag);

    expect (res.compile ()).toEqual (tag.compile ());
    expect (res2.compile ()).toEqual (tag.compile ());
  });

  test ("Functor", () => {
    const tag = player`
      first_name last_name
    `;

    expect (tag[flMap] (n => n).compile ()).toEqual (tag.compile ());

    const prefix = (identifiers: any[]) =>
      identifiers.map ((id: Identifier) => Identifier (`player_${id.name}`));


    const toUpper = (identifiers: any[]) =>
      identifiers.map ((id: Identifier) => Identifier (id.name.toUpperCase ()));

    const res = tag[flMap] (n => toUpper (prefix (n)));
    const res2 = tag[flMap] (prefix)[flMap] (toUpper);

    expect (res.compile ()).toEqual (res2.compile ());
  });

  //   // test ("errors", async () => {
  //   //   const id = Identifier ("id");

  //   //   expect (() => (RQLTag as any) (id))
  //   //     .toThrowError (new Error ("RQLTag should hold a Root node"));

  //   //   expect (() => player`id`.concat (team`id`))
  //   //     .toThrowError (new Error ("U can't concat RQLTags with a different root table"));

  //   //   try {
  //   //     const tag = RQLTag (Root (player, []));
  //   //     (tag as any).node = id;

  //   //     await tag.run (() => Promise.resolve ([]), undefined);
  //   //   } catch (err: any) {
  //   //     expect (err.message).toBe ("You can only run a RQLTag that holds a Root node");
  //   //   }

  //   //   try {
  //   //     const tag = RQLTag (Root (player, []));
  //   //     delete (tag as any).node.table;

  //   //     await tag.run (() => Promise.resolve ([]), {});
  //   //   } catch (err: any) {
  //   //     expect (err.message).toBe ("The Root node has no table");
  //   //   }
  //   // });

  test ("aggregate", async () => {
    const tag = player<{}, Player>`
      id
      first_name
      ${player`
        last_name
      `}
      ${team`
        name
        ${league`
          name
        `}
        ${player`
          last_name
        `}: players
      `}
      ${game`
        result
      `}: games
      ${rating`
        acceleration
        stamina
      `}
      ${sql`
        limit 30
      `}
    `;

    const players = await tag.run (querier, {});
    const player1 = players[0];
    const playerTeam = player1.team;
    const teammate = playerTeam.players[0];
    const teamLeague = player1.team.league;
    const playerGame = player1.games[0];
    const playerRating = player1.rating;

    expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "team", "games", "rating"]);
    expect (Object.keys (playerTeam)).toEqual (["name", "league", "players"]);
    expect (Object.keys (teamLeague)).toEqual (["name"]);
    expect (Object.keys (teammate)).toEqual (["last_name"]);
    expect (Object.keys (playerGame)).toEqual (["result"]);
    expect (Object.keys (playerRating)).toEqual (["acceleration", "stamina"]);
    expect (players.length).toBe (30);
  });

  //   // test ("simplistic", async () => {
  //   //   const tag = player<{}, Player>`
  //   //     ${team}
  //   //     ${game}
  //   //     ${sql`
  //   //       limit 30
  //   //     `}
  //   //   `;

  //   //   const players = await tag.run (querier, {});
  //   //   const player1 = players[0];
  //   //   const playerTeam = player1.team;
  //   //   const playerGame = player1.games[0];

  //   //   expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "cars", "birthday", "team_id", "position_id", "team", "games"]);
  //   //   expect (Object.keys (playerTeam)).toEqual (["id", "name", "league_id"]);
  //   //   expect (Object.keys (playerGame)).toEqual (["id", "home_team_id", "away_team_id", "league_id", "result"]);
  //   // });

  test ("concat", async () => {
    const taggie = player<{id: number}, Player>`
      ${sql`
        ${Raw ((p, t) => null)} 
        ${Value ((p, t) => null)}
        ${(a, b, c) => null}
      `}
    `;

    const tag = player<{}, { id: number; first_name: string}>`
      id
      first_name
    `;

    const tag2 = player<{}, { last_name: string; team: {name: string}}>`
      last_name
      ${team`
        name 
      `}
      ${sql`
        limit 30
      `}
    `;

    const players = await tag.concat (tag2).run (querier, {});
    const player1 = players[0];
    const playerTeam = player1.team;

    expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "team"]);
    expect (Object.keys (playerTeam)).toEqual (["name"]);
    expect (players.length).toBe (30);
  });

  test ("By id", async () => {
    const tag = player<{}, Player>`
      *
      ${sql`
        where ${Raw ((_p, t) => t!.name)}.id = 1
      `}
    `;

    const players = await tag.run (querier, {});
    const player1 = players[0];

    expect (player1.id).toBe (1);
    expect (players.length).toBe (1);
  });

  test ("No record found", async () => {
    const tag = player<{}, Player>`
      ${goal`
        *
      `}
      ${sql`
        where player.id = 999999999
      `}
    `;

    const players = await tag.run (querier, {});

    expect (players.length).toBe (0);
  });
});