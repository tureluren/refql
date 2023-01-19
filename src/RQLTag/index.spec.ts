import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import RQLTag from ".";
import { flConcat, flEmpty, flMap } from "../common/consts";
import { Querier } from "../common/types";
import {
  all, BelongsToMany, Identifier, Literal, Raw,
  RefNode, Value, Values, Values2D, When
} from "../nodes";
import sql from "../SQLTag/sql";
import Table from "../Table";
import format from "../test/format";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import {
  dummy, dummyRefInfo, game, goal, league,
  player, position, rating, team
} from "../test/tables";
import userConfig from "../test/userConfig";
import Parser from "./Parser";
import { TokenType } from "./Tokenizer";

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

  test ("Dynamic nodes", async () => {
    const tag = player`
      ${Identifier ("id")}
      ${[Identifier ("first_name"), Identifier ("last_name")]}
      ${Identifier ("birthday")}
      ${sql`limit 1`}
    `;

    const [query, values] = tag.compile ();

    expect (query).toBe (format (`
      select player.id, player.first_name, player.last_name, player.birthday
      from player
      where 1 = 1
      limit 1
    `));

    expect (values).toEqual ([]);

    const [player1] = await tag.run<any> (querier);

    expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "birthday"]);
  });

  test ("calls and subselect", async () => {
    const tag = player<{}>`
      concat:full_name (first_name, " ", upper(${Identifier ("last_name")}))
      concat:literals (1, ${[Literal (null), Literal (false)]}, true, 'one')
      concat:vars (${sql`cast(${1} as text)`}, ${Raw ("' '")}, ${true}::text, ${sql`null`}::text)

      ${sql`select count (*) from goal where goal.player_id = ${Raw ((_p, t) => `${t!.name}.id`)}`}:no_of_goals
      ${sql`limit 1`}
    `;

    const [query, values] = tag.compile ();

    expect (query).toBe (format (`
      select
        concat (player.first_name, ' ', upper (player.last_name)) full_name,
        concat (1, null, false, true, 'one') literals,
        concat (cast($1 as text), ' ', $2::text, null::text) vars,
        (select count (*) from goal where goal.player_id = player.id) no_of_goals
      from player
      where 1 = 1
      limit 1
    `));

    expect (values).toEqual ([1, true]);

    const [player1] = await tag.run<any> (querier);

    expect (Object.keys (player1)).toEqual (["full_name", "literals", "vars", "no_of_goals"]);
  });

  test ("merge variable of same table", async () => {
    const tag = player<{}>`
      id
      first_name
      ${player`
        last_name
      `}
      ${sql`and player.id = 1`}
      ${player`
        team_id
        ${sql`order by ${Raw ((_p, t) => `${t}`)}.last_name`}
      `}
    `;

    const [query, values] = tag.compile ();

    expect (query).toBe (format (`
      select player.id, player.first_name, player.last_name, player.team_id
      from player
      where 1 = 1
      and player.id = 1
      order by player.last_name
    `));

    expect (values).toEqual ([]);

    const [player1] = await tag.run<any> (querier);

    expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "team_id"]);
  });

   test ("literals", async () => {
     const tag = player<{}>`
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
      where 1 = 1
      limit 1
    `));

    expect (values).toEqual ([]);

    const [player1] = await tag.run (querier);

    expect (player1).toEqual ({ one: 1, two: "2", t: "true", f: "false", n: null });
   });

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

  test ("aggregate", async () => {
    const tag = player<{}>`
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
          ${sql`
            limit 5 
          `}
        `}: defenders
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

    const [query, values, next] = tag.compile ();

    // player
    expect (query).toBe (format (`
      select player.id, player.first_name, player.last_name, player.team_id teamlref, player.id gameslref, player.id ratinglref
      from player
      where 1 = 1
      limit 30
    `));

    expect (values).toEqual ([]);

    // team
    const teamTag = next[0].tag;

    const [teamQuery, teamValues, teamNext] = teamTag.compile ({ refQLRows: [{ teamlref: 1 }, { teamlref: 1 }, { teamlref: 2 }] });

    expect (teamQuery).toBe (format (`
      select * from (
        select distinct player.team_id teamlref from player where player.team_id in ($1, $2)
      ) refqll1, 
      lateral (
        select team.name, team.league_id leaguelref, team.id defenderslref
        from public.team
        where team.id = refqll1.teamlref
      ) refqll2
    `));

    expect (teamValues).toEqual ([1, 2]);

    // league
    const leagueTag = teamNext[0].tag;

    const [leagueQuery, leagueValues, leagueNext] = leagueTag.compile ({ refQLRows: [{ leaguelref: 1 }, { leaguelref: 2 }] });

    expect (leagueQuery).toBe (format (`
      select * from (
        select distinct team.league_id leaguelref from public.team where team.league_id in ($1, $2)
      ) refqll1,
      lateral (
        select league.name from league where league.id = refqll1.leaguelref
      ) refqll2
    `));

    expect (leagueValues).toEqual ([1, 2]);
    expect (leagueNext).toEqual ([]);

    // defenders
    const defendersTag = teamNext[1].tag;

    const [defendersQuery, defendersValues, defendersNext] = defendersTag.compile ({ refQLRows: [{ defenderslref: 1 }, { defenderslref: 2 }] });

    expect (defendersQuery).toBe (format (`
      select * from (
        select distinct team.id defenderslref from public.team where team.id in ($1, $2)
      ) refqll1,
      lateral (
        select player.last_name from player where player.team_id = refqll1.defenderslref
        limit 5
      ) refqll2
    `));

    expect (defendersValues).toEqual ([1, 2]);
    expect (defendersNext).toEqual ([]);

    // game
    const gamesTag = next[1].tag;

    const [gamesQuery, gamesValues, gamesNext] = gamesTag.compile ({ refQLRows: [{ gameslref: 1 }, { gameslref: 2 }] });

    expect (gamesQuery).toBe (format (`
      select * from (
        select distinct player.id gameslref from player where player.id in ($1, $2)
      ) refqll1,
      lateral (
        select game.result from game join game_player on game_player.game_id = game.id where game_player.player_id = refqll1.gameslref
      ) refqll2
    `));

    expect (gamesValues).toEqual ([1, 2]);
    expect (gamesNext).toEqual ([]);

    // rating
    const ratingTag = next[2].tag;

    const [ratingQuery, ratingValues, ratingNext] = ratingTag.compile ({ refQLRows: [{ ratinglref: 1 }, { ratinglref: 2 }] });

    expect (ratingQuery).toBe (format (`
      select * from (
        select distinct player.id ratinglref from player where player.id in ($1, $2)
      ) refqll1,
      lateral (
        select rating.acceleration, rating.stamina from rating where rating.player_id = refqll1.ratinglref
      ) refqll2
    `));

    expect (ratingValues).toEqual ([1, 2]);
    expect (ratingNext).toEqual ([]);

    // db results
    const players = await tag.run<any> (querier, {});
    const player1 = players[0];
    const playerTeam = player1.team;
    const defender = playerTeam.defenders[0];
    const teamLeague = player1.team.league;
    const playerGame = player1.games[0];
    const playerRating = player1.rating;

    expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "team", "games", "rating"]);
    expect (Object.keys (playerTeam)).toEqual (["name", "league", "defenders"]);
    expect (Object.keys (teamLeague)).toEqual (["name"]);
    expect (Object.keys (defender)).toEqual (["last_name"]);
    expect (Object.keys (playerGame)).toEqual (["result"]);
    expect (Object.keys (playerRating)).toEqual (["acceleration", "stamina"]);
    expect (players.length).toBe (30);
  });

  test ("simplistic", async () => {
    const tag = player<{}>`
      ${team}
      ${game}
      ${sql`
        limit 30
      `}
    `;

    const players = await tag.run<any> (querier, {});
    const player1 = players[0];
    const playerTeam = player1.team;
    const playerGame = player1.games[0];

    expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "cars", "birthday", "team_id", "position_id", "team", "games"]);
    expect (Object.keys (playerTeam)).toEqual (["id", "name", "league_id"]);
    expect (Object.keys (playerGame)).toEqual (["id", "home_team_id", "away_team_id", "league_id", "result"]);
  });

  test ("request single", async () => {
    const tag = player<{}>`
      ${game}:1 first_game
      ${goal`
        id
        minute
      `}:1 first_goal
      ${sql`
        and id = 9
      `}
    `;

    const players = await tag.run<any> (querier, {});
    const player1 = players[0];
    const playerGame = player1.first_game;
    const playerGoal = player1.first_goal;

    expect (Object.keys (playerGame)).toEqual (["id", "home_team_id", "away_team_id", "league_id", "result"]);
    expect (Object.keys (playerGoal)).toEqual (["id", "minute"]);
  });

  test ("concat", async () => {
    const tag = player<{}>`
      id
      first_name
    `;

    const tag2 = player<{}>`
      last_name
      ${team`
        name
      `}
      ${sql`
        limit 30
      `}
    `;

    const players = await tag.concat (tag2).run<any> (querier, null as any);
    const player1 = players[0];
    const playerTeam = player1.team;

    expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "team"]);
    expect (Object.keys (playerTeam)).toEqual (["name"]);
    expect (players.length).toBe (30);
  });

  test ("deep concat", async () => {
    const tag = player<{}>`
      id
      first_name
      ${team`
        id
        ${league`
          id 
        `}
      `}
    `;

    const tag2 = player<{}>`
      last_name
      ${team`
        name
        ${league`
          name
        `}
      `}
      ${sql`
        limit 30
      `}
    `;

    const players = await tag.concat (tag2).run<any> (querier, null as any);
    const player1 = players[0];
    const playerTeam = player1.team;
    const teamLeague = player1.team.league;

    expect (Object.keys (player1)).toEqual (["id", "first_name", "last_name", "team"]);
    expect (Object.keys (playerTeam)).toEqual (["id", "name", "league"]);
    expect (Object.keys (teamLeague)).toEqual (["id", "name"]);
    expect (players.length).toBe (30);
  });

  test ("Nested limit and cache", async () => {
    const tag = team<{limit: number}>`
      ${player`
        ${sql`
          limit 4
        `} 
      `} 
      ${sql`
        limit ${p => p.limit} 
      `}
    `;

    const spy = jest.spyOn (tag, "interpret");

    const teams = await tag.run<any> (querier, { limit: 2 });

    expect (teams.length).toBe (2);
    expect (teams[0].players.length).toBe (4);
    expect (teams[1].players.length).toBe (4);

    const teams2 = await tag.run<any> (querier, { limit: 3 });

    expect (teams2.length).toBe (3);
    expect (teams2[0].players.length).toBe (4);
    expect (teams2[1].players.length).toBe (4);
    expect (teams2[2].players.length).toBe (4);

    expect (spy).toBeCalledTimes (1);
  });

  test ("By id", async () => {
    const tag = player<{}>`
      *
      ${sql`
        and ${Raw ((_p, t) => t!.name)}.id = 1
      `}
    `;

    const players = await tag.run<any> (querier, {});
    const player1 = players[0];

    expect (player1.id).toBe (1);
    expect (players.length).toBe (1);
  });

  test ("No record found", async () => {
    const goals = goal`
      *
    `;

    const tag = player`
      ${goals}
      ${sql`
        and player.id = 999999999
      `}
    `;

    const players = await tag.run (querier);

    expect (players.length).toBe (0);
  });

  test ("errors", () => {
    expect (() => player`id last_name`.concat (team`id name`))
      .toThrowError (new Error ("U can't concat RQLTags that come from different tables"));

    expect (() => player`${"id"} last_name`.compile ({}))
      .toThrowError (new Error (`U can't insert "id" in this section of the RQLTag`));
  });

  test ("database error", async () => {
    const message = 'relation "playerr" does not exist';
    try {
      const tag = Table ("playerr")`*`;
      await tag.run (() => Promise.reject (message));
    } catch (err: any) {
      expect (err).toBe (message);
    }
  });

  test ("comments", () => {
    const tag = player<{}>`
      // birthday //id // first_name
      // ${team} ${team} buh
      id
      ${game}
      // ${When (() => true, sql`
      //  order by first_name 
      // `)}
      // ${game`
      //   ${league`
      //     ${sql`
      //       limit 5
      //     `}
      //   `} 
      // `}
      // ${When (() => true, sql`
      //  order by last_name
      // `)}
      concat //: full_name
      (first_name, ' '
        // , last_name
      )
      // ${sql`
      //   limit 5
      // `}
      // ${position}
    `;

    const [query] = tag.compile ({});

    expect (query).toBe (format (`
      select player.id, player.id gameslref, concat (player.first_name, ' ')
      from player
      where 1 = 1
    `));

    const tag2 = player<{}>`// id ${sql`limit 5`}`;
    const [query2] = tag2.compile ({});

    expect (query2).toBe (format (`
      select player.* from player where 1 = 1
    `));
  });

  test ("multiple refs to same table", async () => {
    const tag = game<{}>`
      ${team}
      ${sql`
        and home_team_id = 1
        and away_team_id = 2
        limit 1
      `}
    `;

    const [query] = tag.compile ();

    expect (query).toBe (format (`
      select game.home_team_id hometeamlref,
      game.away_team_id awayteamlref, game.*
      from game where 1 = 1
      and home_team_id = 1
      and away_team_id = 2
      limit 1
    `));

    const games = await tag.run<any> (querier, {});
    const game1 = games[0];

    expect (game1.home_team.id).toBe (1);
    expect (game1.away_team.id).toBe (2);
  });

  test ("when", () => {
    const tag = player<{limit?: number; offset?: number}>`
      id
      ${When (p => !!p.limit, sql`
        limit ${p => p.limit}
      `)} 
      ${When (p => !!p.offset, sql`
        offset ${p => p.offset}
      `)} 
    `;

    const [query, values] = tag.compile ({ limit: 5 });

    expect (query).toBe (format (`
      select player.id from player
      where 1 = 1
      limit $1 
    `));

    expect (values).toEqual ([5]);

    const [query2, values2] = tag.compile ({ offset: 10 });

    expect (query2).toBe (format (`
      select player.id from player
      where 1 = 1
      offset $1 
    `));

    expect (values2).toEqual ([10]);

    const [query3, values3] = tag.compile ({ limit: 5, offset: 10 });

    expect (query3).toBe (format (`
      select player.id from player
      where 1 = 1
      limit $1 
      offset $2 
    `));

    expect (values3).toEqual ([5, 10]);
  });
  test ("parser errors", () => {
    expect (() => player`id, last_name`)
      .toThrowError (new SyntaxError ('Unknown Member Type: ","'));

    expect (() => player`concat(*)`)
      .toThrowError (new SyntaxError ('Unknown Argument Type: "*"'));

    expect (() => player`concat(first_name, ' ' last_name`)
      .toThrowError (new SyntaxError ('Unexpected token: "last_name", expected: ","'));

    expect (() => player`concat(first_name, ' ', last_name`)
      .toThrowError (new SyntaxError ('Unexpected token: "EOT", expected: ","'));

    expect (() => player`${league`*`}`)
      .toThrowError (new Error ("player has no ref defined for: league"));

    expect (() => player`${["name" as any]}`)
      .toThrowError (new Error ("Invalid dynamic members, expected Array of ASTNode"));

    const parser = new Parser ("*", [], player);
    parser.lookahead = { type: "DOUBLE" as TokenType, x: "3.14" };

    expect (() => parser.Literal ())
      .toThrowError (new SyntaxError ('Unknown Literal: "DOUBLE"'));

    parser.lookahead = { type: "NUMBER", x: "1" };

    expect (() => parser.eat ("STRING"))
      .toThrowError (new SyntaxError ('Unexpected token: "1", expected: "STRING"'));
  });

  test ("unimplemented by RQLTag", () => {

    expect (() => player`id ${Raw ("last_name")}`.compile ())
      .toThrowError (new Error ("Unimplemented by RQLTag: Raw"));

    expect (() => player`id ${Value (1)}`.compile ())
      .toThrowError (new Error ("Unimplemented by RQLTag: Value"));

    expect (() => player`id ${Values ([])}`.compile ())
      .toThrowError (new Error ("Unimplemented by RQLTag: Values"));

    expect (() => player`id ${Values2D ([[]])}`.compile ())
      .toThrowError (new Error ("Unimplemented by RQLTag: Values2D"));
  });

  test ("unimplemented by Call", () => {
    expect (() => player`concat (${When (() => true, sql``)})`.compile ())
      .toThrowError (new Error ("Unimplemented by Call: When"));

    expect (() => player`concat (${RefNode (dummyRefInfo, dummy`*`, true)})`.compile ())
      .toThrowError (new Error ("Unimplemented by Call: RefNode"));

    expect (() => player`concat (${BelongsToMany (dummyRefInfo, dummy`*`, true)})`.compile ())
      .toThrowError (new Error ("Unimplemented by Call: BelongsToMany"));

    expect (() => player`concat (${all})`.compile ())
      .toThrowError (new Error ("Unimplemented by Call: All"));

    expect (() => player`concat(${Value (1)})`.compile ())
      .toThrowError (new Error ("Unimplemented by Call: Value"));

    expect (() => player`concat (${Values ([])})`.compile ())
      .toThrowError (new Error ("Unimplemented by Call: Values"));

    expect (() => player`concat (${Values2D ([[]])})`.compile ())
      .toThrowError (new Error ("Unimplemented by Call: Values2D"));

  });
});