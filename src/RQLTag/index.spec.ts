import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import { createRQLTag, isRQLTag } from ".";
import { flConcat, flEmpty } from "../common/consts";
import setConvertPromise from "../common/convertPromise";
import { setDefaultQuerier } from "../common/defaultQuerier";
import { Querier } from "../common/types";
import When from "../common/When";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import Table from "../Table";
import format from "../test/format";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import {
  Game, Goal, League,
  Player, Player2, Rating, Team, XGame
} from "../test/tables";
import userConfig from "../test/userConfig";
import Limit from "./Limit";
import Offset from "./Offset";

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

  setDefaultQuerier (querier);

  afterAll (() => {
    pool.end ();
  });

  test ("create RQLTag", () => {
    const tag = createRQLTag (Player, []);

    expect (tag.nodes).toEqual ([]);
    expect (tag.table.equals (Player)).toBe (true);
    expect (isRQLTag (tag)).toBe (true);
    expect (isRQLTag ({})).toBe (false);
  });

  test ("calls and subselect", async () => {
    const tag = Player ([
      "fullName",
      "goalCount",
      "firstGoalId",
      sql<{ id: number }>`
        and id = ${p => p.id}
      `
    ]);

    const [query, values] = tag.compile ({ id: 9, delimiter: " " });

    expect (query).toBe (format (`
      select
        (concat (player.first_name, ' ', player.last_name)) "fullName",
        (select count (*) from goal where goal.player_id = player.id) "goalCount",
        (select id from goal where goal.player_id = player.id limit 1) "firstGoalId"
      from player
      where 1 = 1
      and id = $1
    `));

    expect (values).toEqual ([9]);

    const [player] = await tag ({ id: 9, delimiter: " " }, querier);

    expect (Number (player.goalCount)).toBeGreaterThan (0);
    expect (Object.keys (player)).toEqual (["fullName", "goalCount", "firstGoalId"]);
  });

  test ("Semigroup", () => {
    const tag = Player (["id"]);
    const tag2 = Player (["firstName", "lastName"]);
    const tag3 = Player (["teamId", "positionId"]);

    const res = tag[flConcat] (tag2)[flConcat] (tag3);
    const res2 = tag[flConcat] (tag2[flConcat] (tag3));

    expect (res.compile ({})).toEqual (res2.compile ({}));
  });

  test ("Monoid", () => {
    const tag = Player (["id", "lastName"]);

    const res = tag[flConcat] (Player.empty ());
    const res2 = Player[flEmpty] ()[flConcat] (tag);

    expect (res.compile ({})).toEqual (tag.compile ({}));
    expect (res2.compile ({})).toEqual (tag.compile ({}));
  });

  test ("aggregate", async () => {
    const { props } = Player;

    const tag = Player ([
      props.id,
      "firstName",
      "lastName",
      Team ([
        "name",
        League (["name"]),
        Player (["lastName", sql`limit 5`])
      ]),
      Game (["result"]),
      Rating (["acceleration", "stamina"]),
      Limit (),
      props.fullName.asc (),
      props.id.desc ()
    ]);

    const [query, values, next] = tag.compile ({ limit: 30, delimiter: " " });

    // player
    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName", player.last_name "lastName",
        player.team_id teamlref, player.id gameslref, player.id ratinglref
      from player
      where 1 = 1
      order by (concat (player.first_name, ' ', player.last_name)) asc, player.id desc
      limit $1
    `));

    expect (values).toEqual ([30]);

    // team
    const teamTag = next[0].tag;

    const [teamQuery, teamValues, teamNext] = teamTag.compile ({ refQLRows: [{ teamlref: 1 }, { teamlref: 1 }, { teamlref: 2 }] });

    expect (teamQuery).toBe (format (`
      select * from (
        select distinct player.team_id teamlref from player where player.team_id in ($1, $2)
      ) refqll1,
      lateral (
        select team.name "name", team.league_id leaguelref, team.id playerslref
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
        select league.name "name" from league where league.id = refqll1.leaguelref
      ) refqll2
    `));

    expect (leagueValues).toEqual ([1, 2]);
    expect (leagueNext).toEqual ([]);

    // defenders (first 5 players of team)
    const defendersTag = teamNext[1].tag;

    const [defendersQuery, defendersValues, defendersNext] = defendersTag.compile ({ refQLRows: [{ playerslref: 1 }, { playerslref: 2 }] });

    expect (defendersQuery).toBe (format (`
      select * from (
        select distinct team.id playerslref from public.team where team.id in ($1, $2)
      ) refqll1,
      lateral (
        select player.last_name "lastName" from player where player.team_id = refqll1.playerslref
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
        select game.result "result" from game join game_player on game_player.game_id = game.id where game_player.player_id = refqll1.gameslref
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
        select rating.acceleration "acceleration", rating.stamina "stamina" from rating where rating.player_id = refqll1.ratinglref
      ) refqll2
    `));

    expect (ratingValues).toEqual ([1, 2]);
    expect (ratingNext).toEqual ([]);

    // db results
    const players = await tag ({ limit: 30, delimiter: " " });
    const player = players[0];
    const playerTeam = player.team;
    const defender = playerTeam!.players[0];
    const teamLeague = player.team!.league;
    const playerGame = player.games[0];
    const playerRating = player.rating;

    expect (Object.keys (player)).toEqual (["id", "firstName", "lastName", "team", "games", "rating"]);
    expect (Object.keys (playerTeam!)).toEqual (["name", "league", "players"]);
    expect (Object.keys (teamLeague)).toEqual (["name"]);
    expect (Object.keys (defender)).toEqual (["lastName"]);
    expect (Object.keys (playerGame)).toEqual (["result"]);
    expect (Object.keys (playerRating)).toEqual (["acceleration", "stamina"]);
    expect (players.length).toBe (30);
  });

  test ("concat", async () => {
    const tag = Player (["id", "firstName"]);

    const tag2 = Player ([
      "lastName",
      Team (["name"]),
      sql`limit 30`
    ]);

    const players = await tag.concat (tag2) ({});
    const player = players[0];
    const playerTeam = player.team;

    expect (Object.keys (player)).toEqual (["id", "firstName", "lastName", "team"]);
    expect (Object.keys (playerTeam!)).toEqual (["name"]);
    expect (players.length).toBe (30);
  });

  test ("aggregate - provided refs", async () => {
    const tag = Player2 ([
      "id",
      Team (["name"]),
      Game (["result"]),
      XGame (["result"]),
      Rating (["acceleration", "stamina"]),
      sql`
        limit 30
      `
    ]);

    const [query, _values, next] = tag.compile ({});

    // player
    expect (query).toBe (format (`
      select player.id "id",
        player.TEAM_ID teamlref, player.id gameslref, player.ID xgameslref, player.ID ratinglref
      from player where 1 = 1
      limit 30
    `));

    // team
    const teamTag = next[0].tag;

    const [teamQuery] = teamTag.compile ({ refQLRows: [{ teamlref: 1 }, { teamlref: 1 }, { teamlref: 2 }] });

    expect (teamQuery).toBe (format (`
      select * from (
        select distinct player.TEAM_ID teamlref from player where player.TEAM_ID in ($1, $2)
      ) refqll1,
      lateral (
        select team.name "name" from public.team where team.ID = refqll1.teamlref
      ) refqll2
    `));

    // game
    const gamesTag = next[1].tag;

    const [gamesQuery] = gamesTag.compile ({ refQLRows: [{ gameslref: 1 }, { gameslref: 2 }] });

    expect (gamesQuery).toBe (format (`
      select * from (
        select distinct player.id gameslref from player where player.id in ($1, $2)
      ) refqll1,
      lateral (
        select game.result "result" from game join GAME_PLAYER on GAME_PLAYER.game_id = game.id where GAME_PLAYER.player_id = refqll1.gameslref
      ) refqll2
    `));

    // xgame
    const xgamesTag = next[2].tag;

    const [xgamesQuery] = xgamesTag.compile ({ refQLRows: [{ xgameslref: 1 }, { xgameslref: 2 }] });

    expect (xgamesQuery).toBe (format (`
      select * from (
        select distinct player.ID xgameslref from player where player.ID in ($1, $2)
      ) refqll1,
      lateral (
        select xgame.result "result" from xgame join player_xgame on player_xgame.XGAME_ID = xgame.ID where player_xgame.PLAYER_ID = refqll1.xgameslref
      ) refqll2
    `));

    // rating
    const ratingTag = next[3].tag;

    const [ratingQuery] = ratingTag.compile ({ refQLRows: [{ ratinglref: 1 }, { ratinglref: 2 }] });

    expect (ratingQuery).toBe (format (`
      select * from (
        select distinct player.ID ratinglref from player where player.ID in ($1, $2)
      ) refqll1,
      lateral (
        select rating.acceleration "acceleration", rating.stamina "stamina" from rating where rating.PLAYER_ID = refqll1.ratinglref
      ) refqll2
    `));
  });

  test ("deep concat", async () => {
    const tag = Player ([
      "id",
      "firstName",
      Team (["id", League ((["id"]))])
    ]);

    const tag2 = Player ([
      "lastName",
      Team ([
        "name",
        League (["name"])
      ]),
      sql`limit 30`
    ]);

    const players = await tag.concat (tag2) ({});
    const player = players[0];
    const playerTeam = player.team;
    const teamLeague = player.team!.league;

    expect (Object.keys (player)).toEqual (["id", "firstName", "lastName", "team"]);
    expect (Object.keys (playerTeam!)).toEqual (["id", "name", "league"]);
    expect (Object.keys (teamLeague)).toEqual (["id", "name"]);
    expect (players.length).toBe (30);
  });

  test ("all fields", async () => {
    const tag = Player ([
      "*",
      sql`limit 1`
    ]);


    const players = await tag (undefined);
    const player = players[0];

    expect (Object.keys (player)).toEqual (["id", "firstName", "lastName", "cars", "birthday", "teamId", "positionId"]);
  });


  test ("Nested limit, nested offset and cache", async () => {
    const tag = Team ([
      "*",
      Player (["*", Limit ("playerLimit"), Offset ("playerOffset")]),
      Limit (),
      Offset ()
    ]);

    const spy = jest.spyOn (tag, "interpret");

    const teams = await tag ({ limit: 2, playerLimit: 4, offset: 3, playerOffset: 5 });
    tag.nodes = [];

    expect (teams.length).toBe (2);
    expect (teams[0].players.length).toBe (4);
    expect (teams[1].players.length).toBe (4);

    const teams2 = await tag ({ limit: 3, playerLimit: 4, offset: 3, playerOffset: 5 });

    expect (teams2.length).toBe (3);
    expect (teams2[0].players.length).toBe (4);
    expect (teams2[1].players.length).toBe (4);
    expect (teams2[2].players.length).toBe (4);

    expect (spy).toBeCalledTimes (1);
  });

  test ("By id", async () => {
    const tag = Player ([
      "*",
      sql<{ id: number }>`
        and ${Raw (Player.name)}.id = ${p => p.id}
      `
    ]);

    const players = await tag ({ id: 9 });
    const player = players[0];

    expect (player.id).toBe (9);
    expect (players.length).toBe (1);
  });

  test ("By id - using Eq", async () => {
    const { id } = Player.props;

    const tag = Player ([
      "*",
      id.eq<{ id: number }> (p => p.id)
    ]);

    const players = await tag ({ id: 9 });
    const player = players[0];

    expect (player.id).toBe (9);
    expect (players.length).toBe (1);
  });

  test ("By team-id - using Eq", async () => {
    const { teamId } = Player.props;

    const tag = Player ([
      "*",
      teamId.eq (2)
    ]);

    const players = await tag ({});
    const player = players[0];

    expect (player.teamId).toBe (2);
    expect (players.length).toBe (11);
  });

  test ("By full-name - using Eq", async () => {
    const { fullName } = Player.props;

    const tag = Player ([
      "id",
      fullName.eq<{ name: string }> (p => p.name)
    ]);

    const [query, values] = await tag.compile ({ name: "John Doe", delimiter: " " });

    expect (query).toBe (format (`
      select player.id "id"
      from player
      where 1 = 1
      and (concat (player.first_name, ' ', player.last_name)) = $1
    `));

    expect (values).toEqual (["John Doe"]);
  });

  test ("Where in and order by", async () => {
    const { id, fullName, teamId, goalCount } = Player.props;

    const tag = Player ([
      "id",
      "firstName",
      "lastName",
      id.in<{ ids: number[] }> (p => p.ids),
      goalCount.in ([0]),
      teamId.in ([1, 2]),
      fullName.desc (),
      id.asc ()
    ]);

    const [query, values] = await tag.compile ({ ids: [1, 2, 3], delimiter: " " });

    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName", player.last_name "lastName"
      from player
      where 1 = 1 
      and player.id in ($1, $2, $3)
      and (select count (*) from goal where goal.player_id = player.id) in ($4)
      and player.team_id in ($5, $6)
      order by (concat (player.first_name, ' ', player.last_name)) desc, player.id asc
    `));

    expect (values).toEqual ([1, 2, 3, 0, 1, 2]);

    const players = await tag ({ ids: [1, 2, 3], delimiter: " " });

    expect (players.length).toBe (3);
  });

  test ("No record found", async () => {
    const goals = Goal (["*"]);

    const tag = Player ([
      goals,
      sql`
        and player.id = 999999999
      `
    ]);

    const players = await tag ({});

    expect (players.length).toBe (0);
  });

  test ("No relation found", async () => {
    const tag = Player ([
      "*",
      Team ([
        "*",
        sql`
          and id = 999999999
        `
      ]),
      sql`
        and player.id = 1
      `
    ]);
    const players = await tag ({});

    expect (players.length).toBe (1);
    expect (players[0].team).toBe (null);
  });

  test ("errors", () => {
    expect (() => Player (["id", "lastName"]).concat (Team (["id", "name"]) as any))
      .toThrowError (new Error ("U can't concat RQLTags that come from different tables"));

    expect (() => Player (["id", "lastName", League (["*"]) as any]))
      .toThrowError (new Error ("player has no ref defined for: league"));

    expect (() => Player (["id", "lastName", 1 as any]))
      .toThrowError (new Error ('Unknown Selectable Type: "1"'));

    expect (() => Player ({} as any))
      .toThrowError (new Error ("Invalid components: not an Array"));

    let tag = Player (["*"]);
    tag.nodes = [1] as any;

    expect (() => tag.compile ({}))
      .toThrowError (new Error ('Unknown RQLNode Type: "1"'));
  });

  test ("database error", async () => {
    const message = 'relation "playerr" does not exist';
    try {
      const tag = Table ("playerr", []) (["*"]);
      await tag ({}, () => Promise.reject (message));
    } catch (err: any) {
      expect (err).toBe (message);
    }
  });

  test ("no querier provided error", async () => {
    const message = "There was no Querier provided";
    try {
      setDefaultQuerier (undefined as any);
      const tag = Player (["*"]);
      await tag ({});
    } catch (err: any) {
      expect (err.message).toBe (message);
    }
    setDefaultQuerier (querier);
  });

  test ("multiple refs to same table", async () => {
    const tag = Game ([
      "id",
      Team (["id", "name"]),
      sql`
        and home_team_id = 1
        and away_team_id = 2
        limit 1
      `
    ]);

    const [query] = tag.compile ({});

    expect (query).toBe (format (`
      select game.id "id", game.home_team_id hometeamlref,
        game.away_team_id awayteamlref
      from game where 1 = 1
      and home_team_id = 1
      and away_team_id = 2
      limit 1
    `));

    const games = await tag ({});
    const game1 = games[0];

    expect (game1.homeTeam.id).toBe (1);
    expect (game1.awayTeam.id).toBe (2);
  });

  test ("when", () => {
    const tag = Player ([
      "id",
      When (p => !!p.limit, [Limit ()]),
      When (p => !!p.offset, [Offset ()])
    ]);

    const [query, values] = tag.compile ({ limit: 5 });

    expect (query).toBe (format (`
      select player.id "id" from player
      where 1 = 1
      limit $1
    `));

    expect (values).toEqual ([5]);

    const [query2, values2] = tag.compile ({ offset: 10 });

    expect (query2).toBe (format (`
      select player.id "id" from player
      where 1 = 1
      offset $1
    `));

    expect (values2).toEqual ([10]);

    const [query3, values3] = tag.compile ({ limit: 5, offset: 10 });

    expect (query3).toBe (format (`
      select player.id "id" from player
      where 1 = 1
      limit $1
      offset $2
    `));

    expect (values3).toEqual ([5, 10]);
  });

  test ("nested when", () => {
    const { id } = Player.props;

    const tag = Player ([
      id,
      When (p => !!p.id, [
        id.eq<{ id: number }> (p => p.id)
      ]),
      When (p => !!p.orderBy, [
        sql<{ orderBy: string }>`
          order by ${Raw (p => p.orderBy)}
        `,
        When (p => !!p.limit, [
          Limit (),
          When (p => !!p.offset, [
            Offset ()
          ])
        ])
      ])
    ]);

    const [query, values] = tag.compile ({ id: 1, orderBy: "last_name" });

    expect (query).toBe (format (`
      select player.id "id" from player
      where 1 = 1
      and player.id = $1
      order by last_name
    `));

    expect (values).toEqual ([1]);

    const [query2, values2] = tag.compile ({ limit: 5 });

    expect (query2).toBe (format (`
      select player.id "id" from player
      where 1 = 1
    `));

    expect (values2).toEqual ([]);

    const [query3, values3] = tag.compile ({ id: 1, orderBy: "last_name", limit: 5 });

    expect (query3).toBe (format (`
      select player.id "id" from player
      where 1 = 1
      and player.id = $1
      order by last_name
      limit $2
    `).replace ("limit $2", "limit $2 "));

    expect (values3).toEqual ([1, 5]);

    const [query4, values4] = tag.compile ({ orderBy: "last_name", limit: 5, offset: 10 });

    expect (query4).toBe (format (`
      select player.id "id" from player
      where 1 = 1
      order by last_name
      limit $1
      offset $2
    `));

    expect (values4).toEqual ([5, 10]);
  });
  test ("convert result", async () => {
    const convert = jest.fn ();

    const id = (x: Promise<any>) => {
      convert ();
      return x;
    };

    setConvertPromise (id);
    const tag = Player (["*"]);

    await tag ({});

    expect (convert).toBeCalledTimes (1);
  });
});