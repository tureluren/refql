import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import { createRQLTag, isRQLTag, RQLTag } from ".";
import BelongsTo from "../Prop/BelongsTo";
import BelongsToMany from "../Prop/BelongsToMany";
import BooleanProp from "../Prop/BooleanProp";
import HasMany from "../Prop/HasMany";
import HasOne from "../Prop/HasOne";
import NumberProp from "../Prop/NumberProp";
import StringProp from "../Prop/StringProp";
import RefQL from "../RefQL";
import Raw from "../SQLTag/Raw";
import { flConcat } from "../common/consts";
import { Querier } from "../common/types";
import format from "../test/format";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import userConfig from "../test/userConfig";
import Limit from "./Limit";
import Offset from "./Offset";
import RefNode from "./RefNode";

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

  const { Table, sql, options, tables } = RefQL ({ querier });

  const { Assist, Game, Goal, League, Rating, Team, GamePlayer, Player: PlayerLtd } = tables.public;

  const isVeteran = BooleanProp ("isVeteran", sql<{ year: number }>`
    select case when extract(year from birthday) < ${p => p.year} then true else false end
    from player
    where id = player.id
    limit 1
  `);

  const fullName = StringProp ("fullName", sql<{ delimiter: string }>`
    concat (player.first_name, ${Raw (p => `'${p.delimiter}'`)}, player.last_name)
  `);

  const goalCount = NumberProp ("goalCount", sql`
    select cast(count(*) as int) from goal
    where goal.player_id = player.id
  `);

  const firstGoalId = NumberProp ("firstGoalId", sql`
    select id from goal
    where goal.player_id = player.id
    limit 1
  `).nullable ();

  const Player = PlayerLtd.addProps ([fullName, goalCount, firstGoalId]);

  afterAll (() => {
    pool.end ();
  });

  test ("create RQLTag", () => {
    const tag = createRQLTag (Player, [], options);

    expect (tag.nodes).toEqual ([]);
    expect (tag.table.equals (Player)).toBe (true);
    expect (isRQLTag (tag)).toBe (true);
    expect (isRQLTag ({})).toBe (false);
  });

  test ("calls and subselect", async () => {
    const tag = Player ([
      "fullName",
      Player.props.goalCount,
      firstGoalId,
      sql<{ id: number }>`
        and id = ${p => p.id}
      `
    ]);

    const [query, values] = tag.compile ({ id: 9, delimiter: " " });

    expect (query).toBe (format (`
      select
        (concat (player.first_name, ' ', player.last_name)) "fullName",
        (select cast(count(*) as int) from goal where goal.player_id = player.id) "goalCount",
        (select id from goal where goal.player_id = player.id limit 1) "firstGoalId",
        player.birthday "birthday", player.cars "cars", player.first_name "firstName", player.id "id", player.last_name "lastName", player.position_id "positionId", player.team_id "teamId"
      from public.player
      where 1 = 1
      and id = $1
    `));

    expect (values).toEqual ([9]);

    const [player] = await tag.run ({ id: 9, delimiter: " " }, querier);

    expect (Number (player.goalCount)).toBeGreaterThan (0);
    expect (Object.keys (player)).toEqual (["fullName", "goalCount", "firstGoalId", "birthday", "cars", "firstName", "id", "lastName", "positionId", "teamId"]);
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
    const tag = Player (["id", "firstName", Limit (1)]);
    const empty = Player ([]);

    const leftIdentity = empty.concat (tag);
    const rightIdentity = tag.concat (empty);
    const leftOutput = (value: typeof leftIdentity.output) => [value.id, value.firstName];
    const rightOutput = (value: typeof rightIdentity.output) => [value.id, value.firstName];

    expect (leftOutput).toBeDefined ();
    expect (rightOutput).toBeDefined ();
    expect (leftIdentity.compile ({})).toEqual (tag.compile ({}));
    expect (rightIdentity.compile ({})).toEqual (tag.compile ({}));
  });

  test ("Semigroup with omitted prop", () => {
    const { id } = Player.props;
    const tag = Player ([id.omit ()]);
    const tag2 = Player (["id"]);
    const tag3 = Player (["firstName"]);

    const left = tag.concat (tag2).concat (tag3);
    const right = tag.concat (tag2.concat (tag3));
    const leftOutput = (value: typeof left.output) => [value.id, value.firstName];
    const rightOutput = (value: typeof right.output) => [value.id, value.firstName];

    const [leftQuery] = left.compile ({});
    const [rightQuery] = right.compile ({});

    expect (leftOutput).toBeDefined ();
    expect (rightOutput).toBeDefined ();
    expect (leftQuery).toBe (rightQuery);
    expect (leftQuery).toBe (format (`
      select player.id "id", player.first_name "firstName" from public.player where 1 = 1
    `));
  });

  test ("Semigroup Nested", () => {
    const tag = Player (["id", Team (["id"]), Goal (["id"])]);
    const tag2 = Player (["firstName", Goal (["minute"]), "lastName", Team (["leagueId"])]);
    const tag3 = Player (["teamId", Goal (["ownGoal"]), "positionId", Team (["name"])]);

    const res = tag[flConcat] (tag2)[flConcat] (tag3);
    const res2 = tag[flConcat] (tag2[flConcat] (tag3));

    const [playersQuery, playersValues, [teamsTag, goalsTag]] = res.compile ({});
    const [playersQuery2, playersValues2, [teamsTag2, goalsTag2]] = res2.compile ({});

    expect (playersQuery).toEqual (playersQuery2);
    expect (playersValues).toEqual (playersValues2);

    const [teamsQuery, teamsValues] = teamsTag.tag.compile ({ refQLRows: [{ teamlref1: 1 }, { teamlref1: 2 }] });
    const [teamsQuery2, teamsValues2] = teamsTag2.tag.compile ({ refQLRows: [{ teamlref1: 1 }, { teamlref1: 2 }] });

    expect (teamsQuery).toEqual (teamsQuery2);
    expect (teamsValues).toEqual (teamsValues2);

    const [goalsQuery, goalsValues] = goalsTag.tag.compile ({ refQLRows: [{ goalslref1: 1 }, { goalslref1: 2 }] });
    const [goalsQuery2, goalsValues2] = goalsTag2.tag.compile ({ refQLRows: [{ goalslref1: 1 }, { goalslref1: 2 }] });

    expect (goalsQuery).toEqual (goalsQuery2);
    expect (goalsValues).toEqual (goalsValues2);
  });

  test ("overwrite omitted prop after concat", () => {
    // idProp.isOmmited && idProp2.isOmitted
    const { id } = Player.props;
    const tag = Player ([id.omit ()]);
    const tag2 = Player (["id", "firstName"]);

    const res = tag.concat (tag2);
    const output = (value: typeof res.output) => [value.id, value.firstName];

    const [query] = res.compile ({});

    expect (output).toBeDefined ();
    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName" from public.player where 1 = 1
    `));
  });

  test ("preserve omitted prop after concat with empty tag", () => {
    const { id } = Player.props;
    const tag = Player ([id.omit ()]).concat (Player ([]));
    const output = (value: typeof tag.output) => value.firstName;

    const [query] = tag.compile ({});

    expect (output).toBeDefined ();
    expect (query).toBe (format (`
      select player.birthday "birthday", player.cars "cars", player.first_name "firstName", player.last_name "lastName", player.position_id "positionId", player.team_id "teamId"
      from public.player
      where 1 = 1
    `));
  });

  test ("merge on RQLTag creation", () => {
    // idProp.isOmmited || idProp2.isOmitted
    const { id, firstName, lastName } = Player.props;
    const tag = Player ([id, id.omit (), firstName, lastName]);

    const [query] = tag.compile ({});

    expect (query).toBe (format (`
      select player.first_name "firstName", player.last_name "lastName" from public.player where 1 = 1
    `));
  });

  test ("omit prop when selecting all columns implicitly", () => {
    const { id, firstName } = Player.props;
    const tag = Player ([id.omit (), firstName.eq ("John")]);

    const [query, values] = tag.compile ({});

    expect (query).toBe (format (`
      select player.first_name "firstName", player.birthday "birthday", player.cars "cars", player.last_name "lastName", player.position_id "positionId", player.team_id "teamId"
      from public.player
      where 1 = 1
      and (player.first_name = $1)
    `));
    expect (values).toEqual (["John"]);
  });

  test ("run", async () => {
    const { props } = Player;

    const tag = Player ([
      props.id.asc (),
      "firstName",
      props.lastName.asc (),
      Team ([
        "name",
        League (["name"]),
        Player (["lastName", sql`limit 5`])
      ]),
      Game (["result"]),
      Rating (["acceleration", "stamina"]),
      Limit<{ limit: number }> (p => p.limit)
    ]);

    const [query, values, next] = tag.compile ({ limit: 30 });

    // player
    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName", player.last_name "lastName",
        player.team_id teamlref1, player.id gameslref1, player.id ratinglref1
      from public.player
      where 1 = 1
      order by player.id asc, player.last_name asc
      limit $1
    `));

    expect (values).toEqual ([30]);

    // team
    const teamTag = next[0].tag;

    const [teamQuery, teamValues, teamNext] = teamTag.compile ({ refQLRows: [{ teamlref1: 1 }, { teamlref1: 1 }, { teamlref1: 2 }] });

    expect (teamQuery).toBe (format (`
      select * from (
        select distinct player.team_id teamlref1 from public.player where player.team_id in ($1, $2)
      ) refqll1,
      lateral (
        select team.name "name", team.league_id leaguelref1, team.id playerslref1
        from public.team
        where team.id = refqll1.teamlref1
      ) refqll2
    `));

    expect (teamValues).toEqual ([1, 2]);

    // league
    const leagueTag = teamNext[0].tag;

    const [leagueQuery, leagueValues, leagueNext] = leagueTag.compile ({ refQLRows: [{ leaguelref1: 1 }, { leaguelref1: 2 }] });

    expect (leagueQuery).toBe (format (`
      select * from (
        select distinct team.league_id leaguelref1 from public.team where team.league_id in ($1, $2)
      ) refqll1,
      lateral (
        select league.name "name" from public.league where league.id = refqll1.leaguelref1
      ) refqll2
    `));

    expect (leagueValues).toEqual ([1, 2]);
    expect (leagueNext).toEqual ([]);

    // defenders (first 5 players of team)
    const defendersTag = teamNext[1].tag;

    const [defendersQuery, defendersValues, defendersNext] = defendersTag.compile ({ refQLRows: [{ playerslref1: 1 }, { playerslref1: 2 }] });

    expect (defendersQuery).toBe (format (`
      select * from (
        select distinct team.id playerslref1 from public.team where team.id in ($1, $2)
      ) refqll1,
      lateral (
        select player.last_name "lastName" from public.player where player.team_id = refqll1.playerslref1
        limit 5
      ) refqll2
    `));

    expect (defendersValues).toEqual ([1, 2]);
    expect (defendersNext).toEqual ([]);

    // game
    const gamesTag = next[1].tag;

    const [gamesQuery, gamesValues, gamesNext] = gamesTag.compile ({ refQLRows: [{ gameslref1: 1 }, { gameslref1: 2 }] });

    expect (gamesQuery).toBe (format (`
      select * from (
        select distinct player.id gameslref1 from public.player where player.id in ($1, $2)
      ) refqll1,
      lateral (
        select game.result "result" from public.game join public.game_player on game_player.game_id = game.id where game_player.player_id = refqll1.gameslref1
      ) refqll2
    `));

    expect (gamesValues).toEqual ([1, 2]);
    expect (gamesNext).toEqual ([]);

    // rating
    const ratingTag = next[2].tag;

    const [ratingQuery, ratingValues, ratingNext] = ratingTag.compile ({ refQLRows: [{ ratinglref1: 1 }, { ratinglref1: 2 }] });

    expect (ratingQuery).toBe (format (`
      select * from (
        select distinct player.id ratinglref1 from public.player where player.id in ($1, $2)
      ) refqll1,
      lateral (
        select rating.acceleration "acceleration", rating.stamina "stamina" from public.rating where rating.player_id = refqll1.ratinglref1
      ) refqll2
    `));

    expect (ratingValues).toEqual ([1, 2]);
    expect (ratingNext).toEqual ([]);

    // db results
    const players = await tag ({ limit: 30 });
    const player = players[0];
    const playerTeam = player.team;
    const defender = playerTeam!.players[0];
    const teamLeague = player.team!.league;
    const playerGame = player.games[0];
    const playerRating = player.rating!;

    expect (Object.keys (player)).toEqual (["id", "firstName", "lastName", "team", "games", "rating"]);
    expect (Object.keys (playerTeam!)).toEqual (["name", "league", "players"]);
    expect (Object.keys (teamLeague || {})).toEqual (["name"]);
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

  test ("run - provided refs", async () => {
    const Player2 = Table ("public.player", [
      NumberProp ("id"),
      StringProp ("firstName", "first_name"),
      StringProp ("lastName", "last_name"),
      StringProp ("birthday"),
      NumberProp ("teamId", "team_id"),
      BelongsTo ("team", "public.team", {
        lRef: ["TEAM_ID"],
        rRef: ["ID"]
      }),
      NumberProp ("positionId", "position_id"),
      HasOne ("rating", "public.rating", {
        lRef: ["ID"],
        rRef: ["PLAYER_ID"]
      }),
      HasMany ("goals", "public.goal", {
        lRef: ["ID"],
        rRef: ["PLAYER_ID"]
      }),
      BelongsToMany ("games", "public.game", {
        xTable: "GAME_PLAYER"
      }),
      BelongsToMany ("xgames", "public.xgame", {
        lRef: ["ID"],
        lxRef: ["PLAYER_ID"],
        rxRef: ["XGAME_ID"],
        rRef: ["ID"]
      })
    ]);

    const XGame = Table ("public.xgame", [
      NumberProp ("id"),
      StringProp ("result"),
      NumberProp ("homeTeamId", "home_team_id"),
      NumberProp ("awayTeamId", "away_team_id"),
      BelongsTo ("homeTeam", "public.team", { lRef: ["home_team_id"] }),
      BelongsTo ("awayTeam", "public.team", { lRef: ["away_team_id"] }),
      NumberProp ("leagueId", "league_id"),
      BelongsTo ("league", "public.league")
    ]);

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
        player.TEAM_ID teamlref1, player.id gameslref1, player.ID xgameslref1, player.ID ratinglref1
      from public.player where 1 = 1
      limit 30
    `));

    // team
    const teamTag = next[0].tag;

    const [teamQuery] = teamTag.compile ({ refQLRows: [{ teamlref1: 1 }, { teamlref1: 1 }, { teamlref1: 2 }] });

    expect (teamQuery).toBe (format (`
      select * from (
        select distinct player.TEAM_ID teamlref1 from public.player where player.TEAM_ID in ($1, $2)
      ) refqll1,
      lateral (
        select team.name "name" from public.team where team.ID = refqll1.teamlref1
      ) refqll2
    `));

    // game
    const gamesTag = next[1].tag;

    const [gamesQuery] = gamesTag.compile ({ refQLRows: [{ gameslref1: 1 }, { gameslref1: 2 }] });

    expect (gamesQuery).toBe (format (`
      select * from (
        select distinct player.id gameslref1 from public.player where player.id in ($1, $2)
      ) refqll1,
      lateral (
        select game.result "result" from public.game join GAME_PLAYER on GAME_PLAYER.game_id = game.id where GAME_PLAYER.player_id = refqll1.gameslref1
      ) refqll2
    `));

    // xgame
    const xgamesTag = next[2].tag;

    const [xgamesQuery] = xgamesTag.compile ({ refQLRows: [{ xgameslref1: 1 }, { xgameslref1: 2 }] });

    expect (xgamesQuery).toBe (format (`
      select * from (
        select distinct player.ID xgameslref1 from public.player where player.ID in ($1, $2)
      ) refqll1,
      lateral (
        select xgame.result "result" from public.xgame join player_xgame on player_xgame.XGAME_ID = xgame.ID where player_xgame.PLAYER_ID = refqll1.xgameslref1
      ) refqll2
    `));

    // rating
    const ratingTag = next[3].tag;

    const [ratingQuery] = ratingTag.compile ({ refQLRows: [{ ratinglref1: 1 }, { ratinglref1: 2 }] });

    expect (ratingQuery).toBe (format (`
      select * from (
        select distinct player.ID ratinglref1 from public.player where player.ID in ($1, $2)
      ) refqll1,
      lateral (
        select rating.acceleration "acceleration", rating.stamina "stamina" from public.rating where rating.PLAYER_ID = refqll1.ratinglref1
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
    expect (Object.keys (teamLeague || {})).toEqual (["id", "name"]);
    expect (players.length).toBe (30);
  });

  test ("concat within", async () => {
    const tag = Player ([
      "id",
      "firstName",
      Team (["id"]),
      Team (["name"]),
      Limit (1)
    ]);

    const players = await tag ({});
    const player = players[0];
    const playerTeam = player.team;

    expect (Object.keys (playerTeam!)).toEqual (["id", "name"]);
  });

  test ("all fields", async () => {
    const tag = Player ([
      sql`limit 1`
    ]);


    const players = await tag (undefined);
    const player = players[0];

    expect (Object.keys (player)).toEqual (["birthday", "cars", "firstName", "id", "lastName", "positionId", "teamId"]);
  });

  test ("empty tag is identity after concat", async () => {
    const tag = Player ([
      "id",
      "firstName",
      Limit (1)
    ]);

    const tag2 = Player ([]);
    const res = tag.concat (tag2);
    const output = (value: typeof res.output) => [value.id, value.firstName];

    const players = await res ({});
    const player = players[0];

    expect (output).toBeDefined ();
    expect (Object.keys (player)).toEqual (["id", "firstName"]);
  });

  test ("Select all even if operations (and after concat)", async () => {
    const { id } = Team.props;
    const { id: leagueId } = League.props;

    const tag = Team ([]).concat (Team ([
      id.eq (1),
      League ([
        leagueId.gt (0)
      ])
    ]));

    const teams = await tag ({});
    const team = teams[0];
    const league = team.league;

    expect (Object.keys (team)).toEqual (["id", "active", "leagueId", "name", "league"]);
    expect (Object.keys (league || {})).toEqual (["id", "name"]);
  });


  test ("Nested limit, nested offset and cache", async () => {
    const tag = Team ([
      Player ([Limit<{ playerLimit: number }> (p => p.playerLimit), Offset<{playerOffset: number}> (p => p.playerOffset)]),
      Limit<{ limit: number }> (p => p.limit),
      Offset (3)
    ]);

    const spy = jest.spyOn (tag, "interpret");

    const teams = await tag ({ limit: 2, playerLimit: 4, playerOffset: 5 });
    tag.nodes = [];

    expect (teams.length).toBe (2);
    expect (teams[0].players.length).toBe (4);
    expect (teams[1].players.length).toBe (4);

    const teams2 = await tag ({ limit: 3, playerLimit: 4, playerOffset: 5 });

    expect (teams2.length).toBe (3);
    expect (teams2[0].players.length).toBe (4);
    expect (teams2[1].players.length).toBe (4);
    expect (teams2[2].players.length).toBe (4);

    expect (spy).toBeCalledTimes (1);
  });

  test ("By id", async () => {
    const tag = Player ([
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
      id.eq<{ id: number }> (p => p.id)
    ]);

    const players = await tag ({ id: 1 });
    const player = players[0];

    expect (player.id).toBe (1);
    expect (players.length).toBe (1);
  });

  test ("By teamId - using Eq", async () => {
    const { teamId } = Player.props;

    const tag = Player ([
      teamId.eq (2)
    ]);

    const players = await tag ();
    const player = players[0];

    expect (player.teamId).toBe (2);
    expect (players.length).toBe (11);
  });

  test ("By fullName and isVeteran - using Eq", async () => {

    const tag = Player ([
      "id",
      fullName.eq<{ name: string }> (p => p.name).omit (),
      isVeteran.eq (false).omit ()
    ]);

    const [query, values] = await tag.compile ({ name: "John Doe", delimiter: " ", year: 1980 });

    expect (query).toBe (format (`
      select player.id "id"
      from public.player
      where 1 = 1
      and ((concat (player.first_name, ' ', player.last_name)) = $1)
      and ((select case when extract(year from birthday) < $2 then true else false end from player where id = player.id limit 1) = $3)
    `));

    expect (values).toEqual (["John Doe", 1980, false]);
  });


  test ("Where in and order by", async () => {
    const { id, teamId, birthday } = Player.props;

    const tag = Player ([
      fullName.desc ().omit (),
      id.in<{ ids: number[] }> (p => p.ids).asc (),
      "firstName",
      "lastName",
      goalCount.in ([0]).omit (),
      teamId.in ([1, 2]).omit (),
      birthday.ascNullsFirst ().omit ().ascNullsLast ().descNullsLast ().descNullsFirst ()
    ]);

    const [query, values] = await tag.compile ({ ids: [1, 2, 3], delimiter: " " });

    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName", player.last_name "lastName"
      from public.player
      where 1 = 1 
      and (player.id in ($1, $2, $3))
      and ((select cast(count(*) as int) from goal where goal.player_id = player.id) in ($4))
      and (player.team_id in ($5, $6))
      order by (concat (player.first_name, ' ', player.last_name)) desc, 
        player.id asc, 
        player.birthday asc nulls first,
        player.birthday asc nulls last,
        player.birthday desc nulls last,
        player.birthday desc nulls first
    `));

    expect (values).toEqual ([1, 2, 3, 0, 1, 2]);

    const players = await tag ({ ids: [1, 2, 3], delimiter: " " });

    expect (players.length).toBe (3);
  });

  test ("Where not in", async () => {
    const { id, teamId } = Player.props;

    const tag = Player ([
      id.notIn<{ ids: number[] }> (p => p.ids).notEq (1),
      "firstName",
      "lastName",
      teamId.in ([1])
    ]);

    const [query, values] = await tag.compile ({ ids: [2, 3, 4] });

    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName", player.last_name "lastName", player.team_id "teamId"
      from public.player
      where 1 = 1 
      and (player.id not in ($1, $2, $3) and player.id != $4)
      and (player.team_id in ($5))
    `));

    expect (values).toEqual ([2, 3, 4, 1, 1]);

    const players = await tag ({ ids: [2, 3, 4] });

    expect (players.length).toBe (7);
  });

  test ("Ord numbers", async () => {
    const { id, teamId } = Player.props;

    const tag = Player ([
      id.lte (100),
      "firstName",
      "lastName",
      teamId.lt (10).gte<{ teamId: number }> (p => p.teamId).omit (),
      goalCount.gt<{ count: number }> (p => p.count),
      Limit<{ limit: number }> (p => p.limit)
    ]);

    const [query, values] = await tag.compile ({ count: 1, limit: 5, teamId: 0 });

    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName", player.last_name "lastName",
        (select cast(count(*) as int) from goal where goal.player_id = player.id) "goalCount"
      from public.player
      where 1 = 1
      and (player.id <= $1)
      and (player.team_id < $2 and player.team_id >= $3)
      and ((select cast(count(*) as int) from goal where goal.player_id = player.id) > $4)
      limit $5
    `));

    expect (values).toEqual ([100, 10, 0, 1, 5]);

    const players = await tag ({ count: 1, limit: 5, teamId: 0 });

    expect (players.length).toBe (5);
    expect (players[0].goalCount).toBeGreaterThan (1);
  });

  test ("Ord strings", async () => {
    const { id, firstName, lastName, birthday } = Player.props;

    const today = new Date ();

    const tag = Player ([
      id,
      firstName.gt ("A").lt ("Z"),
      fullName.gt ("A").lt ("Z"),
      lastName.gte ("A").lte ("Z"),
      birthday.lt (today).omit (),
      Limit<{ limit: number}> (p => p.limit)
    ]);

    const [query, values] = await tag.compile ({ delimiter: " ", limit: 5 });

    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName",
        (concat (player.first_name, ' ', player.last_name)) "fullName",
        player.last_name "lastName"
      from public.player
      where 1 = 1
      and (player.first_name > $1 and player.first_name < $2)
      and ((concat (player.first_name, ' ', player.last_name)) > $3 and (concat (player.first_name, ' ', player.last_name)) < $4)
      and (player.last_name >= $5 and player.last_name <= $6)
      and (player.birthday < $7)
      limit $8
    `));

    expect (values).toEqual (["A", "Z", "A", "Z", "A", "Z", today, 5]);

    const players = await tag ({ limit: 5, delimiter: " " });

    expect (players.length).toBe (5);
  });

  test ("Like", async () => {
    const { lastName } = Player.props;
    const { name } = Team.props;

    const tag = Player ([
      "id",
      "firstName",
      lastName.like<{ lastName: string }> (p => p.lastName),
      Team ([
        name.notLike (`%A%`)
      ]),
      fullName.like (`%Be%`).omit ()
    ]);

    const [query, values, next] = await tag.compile ({ delimiter: " ", lastName: "Be%" });

    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName", player.last_name "lastName",
        player.team_id teamlref1
      from public.player
      where 1 = 1
      and (player.last_name like $1)
      and ((concat (player.first_name, ' ', player.last_name)) like $2)
    `));

    expect (values).toEqual (["Be%", "%Be%"]);

    const [teamQuery, teamValues] = await next[0].tag.compile ({ refQLRows: [{ teamlref1: 1 }] });

    expect (teamQuery).toBe (format (`
      select * from (
        select distinct player.team_id teamlref1 from public.player where player.team_id in ($1)
      ) refqll1,
      lateral (select team.name "name", team.active "active", team.id "id", team.league_id "leagueId" from public.team where team.id = refqll1.teamlref1 and (team.name not like $2)
      ) refqll2
    `));

    expect (teamValues).toEqual ([1, "%A%"]);
  });

  test ("ILike", async () => {
    const { lastName } = Player.props;
    const { name } = Team.props;

    const tag = Player ([
      "id",
      "firstName",
      lastName.iLike<{ lastName: string }> (p => p.lastName),
      Team ([
        name.notILike (`%A%`)
      ]),
      fullName.iLike (`%Be%`).omit ()
    ]);

    const [query, values, next] = await tag.compile ({ delimiter: " ", lastName: "Be%" });

    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName", player.last_name "lastName",
        player.team_id teamlref1
      from public.player
      where 1 = 1
      and (player.last_name ilike $1)
      and ((concat (player.first_name, ' ', player.last_name)) ilike $2)
    `));

    expect (values).toEqual (["Be%", "%Be%"]);

    const [teamQuery, teamValues] = await next[0].tag.compile ({ refQLRows: [{ teamlref1: 1 }] });

    expect (teamQuery).toBe (format (`
      select * from (
        select distinct player.team_id teamlref1 from public.player where player.team_id in ($1)
      ) refqll1,
      lateral (select team.name "name", team.active "active", team.id "id", team.league_id "leagueId" from public.team where team.id = refqll1.teamlref1 and (team.name not ilike $2)
      ) refqll2
    `));

    expect (teamValues).toEqual ([1, "%A%"]);
  });

  test ("IsNull", async () => {
    const { lastName } = Player.props;
    const { name } = Team.props;

    const tag = Player ([
      "id",
      "firstName",
      lastName.isNull (),
      Team ([
        name.notIsNull ()
      ]),
      fullName.isNull ().omit ()
    ]);

    const [query, values, next] = await tag.compile ({ delimiter: " " });

    expect (query).toBe (format (`
      select player.id "id", player.first_name "firstName", player.last_name "lastName",
        player.team_id teamlref1
      from public.player
      where 1 = 1
      and (player.last_name is null)
      and ((concat (player.first_name, ' ', player.last_name)) is null)
    `));

    expect (values).toEqual ([]);

    const [teamQuery, teamValues] = await next[0].tag.compile ({ refQLRows: [{ teamlref1: 1 }] });

    expect (teamQuery).toBe (format (`
      select * from (
        select distinct player.team_id teamlref1 from public.player where player.team_id in ($1)
      ) refqll1,
      lateral (select team.name "name", team.active "active", team.id "id", team.league_id "leagueId" from public.team where team.id = refqll1.teamlref1 and (team.name is not null)
      ) refqll2
    `));

    expect (teamValues).toEqual ([1]);
  });

  test ("Or", async () => {
    const { lastName } = Player.props;

    const cars = StringProp ("cars");

    const tag = Player ([
      "id",
      "lastName",
      lastName.like ("A%").or (lastName.like ("B%")),
      cars.desc ().omit ()
    ]);

    const [query, values] = await tag.compile ({});

    expect (query).toBe (format (`
      select player.id "id", player.last_name "lastName"
      from public.player
      where 1 = 1
      and (player.last_name like $1 or player.last_name like $2)
      order by cars desc
    `));

    expect (values).toEqual (["A%", "B%"]);
  });

  test ("And", async () => {
    const { lastName, firstName } = Player.props;

    const tag = Player ([
      "id",
      "lastName",
      lastName.like ("A%").and (firstName.like ("B%").or (fullName.like ("C%")))
    ]);

    const [query, values] = await tag.compile ({ delimiter: " " });

    expect (query).toBe (format (`
      select player.id "id", player.last_name "lastName"
      from public.player
      where 1 = 1
      and (player.last_name like $1 and (player.first_name like $2 or (concat (player.first_name, ' ', player.last_name)) like $3))
    `));

    expect (values).toEqual (["A%", "B%", "C%"]);
  });

  test ("And with SQLTag", async () => {
    const { firstName } = Player.props;

    const fullNameLike = sql<{ delimiter2: string; q: string }>`
      concat (player.last_name, ${Raw (p => `'${p.delimiter2}'`)}, player.first_name) ilike ${p => p.q}
    `;

    const tag = Player ([
      firstName.iLike ("a%").and (fullNameLike),
      fullName.iLike ("a%"),
      Limit<{ limit: number }> (p => p.limit)
    ]);

    const [query, values] = await tag.compile ({ delimiter: " ", delimiter2: " ", q: "G%", limit: 2 });

    expect (query).toBe (format (`
      select player.first_name "firstName", (concat (player.first_name, ' ', player.last_name)) "fullName", player.birthday "birthday", player.cars "cars", player.id "id", player.last_name "lastName", player.position_id "positionId", player.team_id "teamId"
      from public.player
      where 1 = 1
      and (player.first_name ilike $1 and concat (player.last_name, ' ', player.first_name) ilike $2)
      and ((concat (player.first_name, ' ', player.last_name)) ilike $3) limit $4
    `));

    expect (values).toEqual (["a%", "G%", "a%", 2 ]);
  });

  test ("No record found", async () => {
    const goals = Goal ([]);

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
      Team ([
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

  test ("required returns only games with non-own goals from minute 80", async () => {
    const lateGoals = Goal ([
      Goal.props.minute.gte (80),
      Goal.props.ownGoal.eq (false),
      Player (["firstName", "lastName"])
    ]).required ();

    const readGamesWithLateGoals = Game ([
      "id",
      "result",
      lateGoals,
      Limit (5)
    ]);

    const [query, values] = readGamesWithLateGoals.compile ({});
    const games = await readGamesWithLateGoals ({});

    expect (query).toContain ("and exists (select goal.minute");
    expect (query).toContain ("goal.game_id = game.id");
    expect (query).toContain ("goal.minute >= $1");
    expect (query).toContain ("goal.own_goal = $2");
    expect (values).toEqual ([80, false, 5]);
    expect (games.length).toBeGreaterThan (0);
    expect (games.every (game => game.goals.length > 0)).toBe (true);
    expect (games.flatMap (game => game.goals).every (goal => goal.minute >= 80 && goal.ownGoal === false)).toBe (true);
    expect (games.flatMap (game => game.goals).every (goal => goal.player.firstName.length > 0 && goal.player.lastName.length > 0)).toBe (true);
  });

  test ("nested required only bubbles through explicitly required relations", async () => {
    const impossiblePlayers = Player ([
      "id",
      Player.props.id.eq (-1)
    ]).required ();

    const optionalTeams = Team (["id", impossiblePlayers]);
    const requiredTeams = optionalTeams.required ();

    const optionalLeagues = await League (["id", optionalTeams, Limit (1)]) ({});
    const requiredLeagues = await League (["id", requiredTeams]) ({});

    expect (optionalLeagues.length).toBe (1);
    expect (optionalLeagues[0].teams).toEqual ([]);
    expect (requiredLeagues).toEqual ([]);
  });

  test ("required works for singular football relations", async () => {
    const missingLeague = League ([League.props.id.eq (-1)]).required ();
    const teams = await Team (["id", missingLeague]) ({});

    expect (teams).toEqual ([]);
  });

  test ("required works for goals, games and assists", async () => {
    const impossibleGoal = Goal ([Goal.props.id.eq (-1)]).required ();
    const impossibleGame = Game ([Game.props.id.eq (-1)]).required ();
    const impossibleAssist = Assist ([Assist.props.id.eq (-1)]).required ();

    const games = await Game (["id", impossibleGoal]) ({});
    const leagues = await League (["id", impossibleGame]) ({});
    const players = await Player (["id", impossibleGame]) ({});
    const goals = await Goal (["id", impossibleAssist]) ({});

    expect (games).toEqual ([]);
    expect (leagues).toEqual ([]);
    expect (players).toEqual ([]);
    expect (goals).toEqual ([]);
  });

  test ("one returns one sorted object per parent", async () => {
    const firstTeam = Team ([
      "id",
      "leagueId",
      Team.props.id.asc ()
    ]).one ();

    const leagues = await League ([
      "id",
      firstTeam,
      League.props.id.asc (),
      Limit (3)
    ]) ({});

    expect (leagues.length).toBe (3);
    expect (leagues.every (league => league.teams != null && !Array.isArray (league.teams))).toBe (true);
    expect (leagues.map (league => league.teams!.leagueId)).toEqual (leagues.map (league => league.id));
    expect (leagues.map (league => league.teams!.id)).toEqual ([1, 11, 21]);
  });

  test ("one directly returns a complete team detail", async () => {
    const readTeamById = Team ([
      "id",
      "name",
      "active",
      League (["name"]),
      Player (["id", "firstName", "lastName", Player.props.id.asc ()]),
      Team.props.id.eq<{ teamId: number }> (p => p.teamId)
    ]).one ();

    const team = await readTeamById ({ teamId: 1 });

    expect (Array.isArray (team)).toBe (false);
    expect (team.id).toBe (1);
    expect (team.name.length).toBeGreaterThan (0);
    expect (team.active).toBe (true);
    expect (team.league!.name.length).toBeGreaterThan (0);
    expect (team.players.length).toBe (11);
    expect (team.players.every (player => player.firstName.length > 0 && player.lastName.length > 0)).toBe (true);
    expect (team.players.map (player => player.id)).toEqual ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  test ("one throws for no row while one(false) returns null", async () => {
    const requiredTeam = Team (["id", Team.props.id.eq (-1)]).one ();
    const optionalTeam = Team (["id", Team.props.id.eq (-1)]).one (false);

    const requiredOutput = (value: Awaited<ReturnType<typeof requiredTeam>>) => value.id;
    const optionalOutput = (value: Awaited<ReturnType<typeof optionalTeam>>) => value?.id;

    expect (requiredOutput).toBeDefined ();
    expect (optionalOutput).toBeDefined ();
    await expect (requiredTeam ({})).rejects.toThrow ("Required one query returned no team row");
    await expect (optionalTeam ({})).resolves.toBe (null);
  });

  test ("one(false) returns the latest goal of a game or null", async () => {
    const [scoredGoal] = await Goal (["gameId", Limit (1)]) ({});

    const readLatestGoal = Goal ([
      "gameId",
      Goal.props.minute.desc (),
      Player (["firstName", "lastName"]),
      Goal.props.gameId.eq<{ gameId: number }> (p => p.gameId)
    ]).one (false);

    const goals = await Goal ([
      "minute",
      Goal.props.gameId.eq (scoredGoal.gameId),
      Goal.props.minute.desc ()
    ]) ({});
    const latestGoal = await readLatestGoal ({ gameId: scoredGoal.gameId });
    const missingGoal = await readLatestGoal ({ gameId: -1 });

    expect (latestGoal).not.toBe (null);
    expect (latestGoal!.gameId).toBe (scoredGoal.gameId);
    expect (latestGoal!.minute).toBe (goals[0].minute);
    expect (latestGoal!.player.firstName.length).toBeGreaterThan (0);
    expect (latestGoal!.player.lastName.length).toBeGreaterThan (0);
    expect (missingGoal).toBe (null);
  });

  test ("nested one returns the first squad player and first goal", async () => {
    const team = await Team ([
      "id",
      Player (["id", Player.props.id.asc ()]).one (),
      Team.props.id.eq (1)
    ]).one () ({});

    const [game] = await Game ([
      "id",
      Goal (["id", Goal.props.minute.asc ()]).one (false),
      Game.props.id.eq (1)
    ]) ({});

    expect (team!.players).not.toBe (null);
    expect (Array.isArray (team!.players)).toBe (false);
    expect (game.goals === null || !Array.isArray (game.goals)).toBe (true);
  });

  test ("one(false) returns null while one removes a parent for an empty relation", async () => {
    const noPlayers = Player ([Player.props.id.eq (-1)]).required ();
    const optionalTeam = Team (["id", noPlayers]).one (false);
    const requiredTeam = Team (["id", noPlayers]).one ();

    const [league] = await League (["id", optionalTeam, League.props.id.eq (1)]) ({});
    const requiredLeagues = await League (["id", requiredTeam, League.props.id.eq (1)]) ({});

    expect (league.teams).toBe (null);
    expect (requiredLeagues).toEqual ([]);
  });

  test ("required and one are order independent", async () => {
    const relation1 = Team (["id", Team.props.id.eq (-1)]).required ().one (false);
    const relation2 = Team (["id", Team.props.id.eq (-1)]).one (false).required ();

    const [query1, values1, next1] = League ([relation1]).compile ({});
    const [query2, values2, next2] = League ([relation2]).compile ({});

    expect ([query1, values1]).toEqual ([query2, values2]);
    expect (next1.map (({ link, single }) => ({ link, single }))).toEqual (next2.map (({ link, single }) => ({ link, single })));
    expect (await League ([relation1]) ({})).toEqual ([]);
    expect (await League ([relation2]) ({})).toEqual ([]);
  });

  test ("required and one survive associative concat and identities", () => {
    const a = League (["id", Team (["id"]).required ()]);
    const b = League (["name", Team (["name"]).one ()]);
    const c = League ([Team ([Team.props.active.eq (true)])]);
    const empty = League ([]);

    const left = a.concat (b).concat (c);
    const right = a.concat (b.concat (c));

    const compileShape = (tag: RQLTag) => {
      const [query, values, next] = tag.compile ({});
      return [query, values, next.map (({ link, single }) => ({ link, single }))];
    };

    expect (compileShape (left)).toEqual (compileShape (right));
    expect (compileShape (empty.concat (left))).toEqual (compileShape (left));
    expect (compileShape (left.concat (empty))).toEqual (compileShape (left));
    expect (left.nodes.filter (RefNode.isRefNode)[0].tag.isRequired).toBe (true);
    expect (left.nodes.filter (RefNode.isRefNode)[0].tag.isOne).toBe (true);
  });

  test ("errors", () => {
    const { lastName } = Player.props;

    expect (() => Player (["id", "lastName"]).concat (Team (["id", "name"]) as any))
      .toThrowError (new Error ("U can't concat RQLTags that come from different tables"));

    expect (() => Player (["id", "lastName", League ([]) as any]))
      .toThrowError (new Error ("public.player has no ref defined for: public.league"));

    expect (() => Player (["id", "lastName", League as any]))
      .toThrowError (new Error ("public.player has no ref defined for: public.league"));

    expect (() => Player (["id", "lastName", 1 as any]))
      .toThrowError (new Error ('Unknown Selectable Type: "1"'));

    expect (() => Player ([lastName.or (lastName)]))
      .toThrowError (new Error ('"or" called on Prop without operations'));

    expect (() => Player ([lastName.iLike ("a%").or (lastName)]))
      .toThrowError (new Error ("Prop without operations passed"));

    expect (() => Player ([lastName.iLike ("a%").or (lastName.iLike ("b%").desc ())]).compile ({}))
      .toThrowError (new Error ("No OrderBy operation allowed here"));

    expect (() => Player ([]).concat (Team (["id", "name"]) as any))
      .toThrowError (new Error ("U can't concat RQLTags that come from different tables"));

    expect (() => Player ({} as any))
      .toThrowError (new Error ("Invalid components: not an Array"));

    let tag = Player ([]);
    tag.nodes = [1] as any;

    expect (() => tag.compile ({}))
      .toThrowError (new Error ('Unknown RQLNode Type: "1"'));
  });

  test ("database error", async () => {
    const message = 'relation "playerr" does not exist';
    try {
      const tag = Table ("playerr", []) ([]);
      await tag.run ({}, () => Promise.reject (message));
    } catch (err: any) {
      expect (err).toBe (message);
    }
  });

  test ("no querier provided error", async () => {
    const message = "There was no Querier provided";
    try {
      RefQL ({} as any);
      const tag = Player ([]);
      await tag ({});
    } catch (err: any) {
      expect (err.message).toBe (message);
    }
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
      select game.id "id", game.away_team_id awayteamlref1, game.home_team_id hometeamlref1
      from public.game where 1 = 1
      and home_team_id = 1
      and away_team_id = 2
      limit 1
    `));

    const games = await tag ({});
    const game1 = games[0];

    expect (game1.homeTeam.id).toBe (1);
    expect (game1.awayTeam.id).toBe (2);
  });

  test ("convert result", async () => {
    const convert = jest.fn ();

    const id = (tag: any, params: any) => {
      convert ();
      return tag.run (params);
    };

    const RefqQLWithRunner = RefQL ({
      querier,
      runner: id
    });

    const PlayerWithRunner = RefqQLWithRunner.Table ("player", []);

    const tag = PlayerWithRunner ([]);

    await tag ({});

    expect (convert).toBeCalledTimes (1);
  });

  test ("Table as selectable", async () => {
    const { homeTeamId, awayTeamId } = Game.props;
    const tag = Game ([
      Team,
      awayTeamId.eq (2),
      homeTeamId.eq (1),
      Limit (1)
    ]);

    const [query] = tag.compile ({});

    expect (query).toBe (format (`
      select game.away_team_id awayteamlref1, game.home_team_id hometeamlref1, game.away_team_id "awayTeamId", game.home_team_id "homeTeamId", game.date "date", game.id "id", game.league_id "leagueId", game.result "result" 
      from public.game where 1 = 1 
      and (game.away_team_id = $1)
      and (game.home_team_id = $2)
      limit $3
    `));

    const games = await tag ({});
    const game1 = games[0];

    expect (game1.homeTeam.id).toBe (1);
    expect (game1.awayTeam.id).toBe (2);
  });

  test ("Multiple column ref", async () => {
    const tag = Goal ([
      GamePlayer,
      Limit (1)
    ]);

    const goals = await tag ({});
    const goal1 = goals[0];

    expect (goal1.gameId).toBe (goal1.gamePlayer.gameId);
    expect (goal1.playerId).toBe (goal1.gamePlayer.playerId);

    const [query, values, next] = await tag.compile ({});

    expect (query).toBe (format (`
      select goal.player_id gameplayerlref1, goal.game_id gameplayerlref2, goal.game_id "gameId", goal.id "id", goal.minute "minute", goal.own_goal "ownGoal", goal.player_id "playerId"
      from public.goal where 1 = 1 limit $1
    `));

    expect (values).toEqual ([1]);


    const [gamePlayerQuery, gamePlayerValues] = await next[0].tag.compile ({ refQLRows: [{ gameplayerlref1: goal1.playerId, gameplayerlref2: goal1.gameId }] });

    expect (gamePlayerQuery).toBe (format (`
      select * from (
        select distinct goal.player_id gameplayerlref1, goal.game_id gameplayerlref2 from public.goal where goal.player_id in ($1) and goal.game_id in ($2)
      ) refqll1, lateral (
        select game_player.game_id "gameId", game_player.player_id "playerId" from public.game_player where game_player.player_id = refqll1.gameplayerlref1 and game_player.game_id = refqll1.gameplayerlref2
        ) refqll2
    `));

    expect (gamePlayerValues).toEqual ([goal1.playerId, goal1.gameId]);

  });
});