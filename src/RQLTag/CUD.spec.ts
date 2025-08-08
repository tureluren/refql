import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import BooleanProp from "../Prop/BooleanProp";
import RefQL from "../RefQL";
import { Querier } from "../common/types";
import format from "../test/format";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import userConfig from "../test/userConfig";
import { isCUD } from "./CUD";
import { createDeleteRQLTag, isDeleteRQLTag } from "./DeleteRQLTag";
import { createInsertRQLTag, isInsertRQLTag } from "./InsertRQLTag";
import { createUpdateRQLTag, isUpdateRQLTag } from "./UpdateRQLTag";

describe ("CUD", () => {
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

  const { sql, options, tables } = RefQL ({ querier });

  const { Game, Player, Rating } = tables.public;

  afterAll (() => {
    pool.end ();
  });
  test ("is CUD", () => {
    expect (isCUD (createInsertRQLTag (Player, [], options))).toBe (true);
    expect (isCUD ("cud")).toBe (false);
  });

  test ("is InsertRQLTag", () => {
    expect (isInsertRQLTag (createInsertRQLTag (Player, [], options))).toBe (true);
    expect (isUpdateRQLTag (createInsertRQLTag (Player, [], options))).toBe (false);
    expect (isInsertRQLTag ("insertSQLTag")).toBe (false);
  });

  test ("is UpdateRQLTag", () => {
    expect (isUpdateRQLTag (createUpdateRQLTag (Player, [], options))).toBe (true);
    expect (isInsertRQLTag (createUpdateRQLTag (Player, [], options))).toBe (false);
    expect (isUpdateRQLTag ("updateSQLTag")).toBe (false);
  });

  test ("is DeleteRQLTag", () => {
    expect (isDeleteRQLTag (createDeleteRQLTag (Player, [], options))).toBe (true);
    expect (isDeleteRQLTag (createUpdateRQLTag (Player, [], options))).toBe (false);
    expect (isDeleteRQLTag ("deleteSQLTag")).toBe (false);
  });

  test ("Insert, update and delete", async () => {
    const insertData = [{ homeTeamId: 1, awayTeamId: 2, date: new Date (), result: "1-1", leagueId: 1 }];

    const tag = Game.insert ([]);

    const [query] = tag.compile ({ data: insertData });

    expect (query).toBe (format (`
      insert into public.game (away_team_id, date, home_team_id, id, league_id, result) 
      values ($1, $2, $3, DEFAULT, $4, $5) 
      returning game.away_team_id "awayTeamId", game.date "date", game.home_team_id "homeTeamId", game.id "id", game.league_id "leagueId", game.result "result"
    `));

    const games = await tag ({ data: insertData });
    const game1 = games[0];

    expect (games.length).toBe (1);
    expect (game1.homeTeamId).toBe (1);
    expect (game1.awayTeamId).toBe (2);
    expect (Object.keys (game1)).toEqual (["awayTeamId", "date", "homeTeamId", "id", "leagueId", "result"]);

    const tag2 = Game.update ([
      Game.props.id.eq<{ id: number }> (p => p.id),
      Game ([
        Game.props.id.in<{ rows: { id: number}[]}> (({ rows }) => rows.map (r => r.id)),
        "result"
      ])
    ]);

    const updateData = { leagueId: 2, result: "2-1" };
    const [query2] = tag2.compile ({ data: updateData, id: game1.id });

    expect (query2).toBe (format (`
      update public.game set league_id = $1, result = $2
      where 1 = 1 and game.id = $3 
      returning game.away_team_id "awayTeamId", game.date "date", game.home_team_id "homeTeamId", game.id "id", game.league_id "leagueId", game.result "result"
    `));

    const games2 = await tag2 ({ data: updateData, id: game1.id });
    const game2 = games2[0];

    expect (games2.length).toBe (1);
    expect (game2.id).toBe (game1.id);
    expect (Object.keys (game2)).toEqual (["id", "result"]);

    const tag3 = Game.delete ([
      Game.props.id.eq<{ id: number }> (p => p.id)
    ]);

    const [query3] = tag3.compile ({ id: game1.id });

    expect (query3).toBe (format (`
      delete from public.game 
      where 1 = 1 
      and game.id = $1 
      returning game.away_team_id "awayTeamId", game.date "date", game.home_team_id "homeTeamId", game.id "id", game.league_id "leagueId", game.result "result"
    `));

    const games3 = await tag3 ({ id: game1.id });
    const game3 = games3[0];

    expect (games3.length).toBe (1);
    expect (game3.id).toBe (game1.id);
    expect (Object.keys (game3)).toEqual (["awayTeamId", "date", "homeTeamId", "id", "leagueId", "result"]);
  });

  test ("Insert, update and delete with SQLProps and SQLTags", async () => {
    const insertData = [{ homeTeamId: 1, awayTeamId: 2, date: new Date (), result: "1-1", leagueId: 1 }];

    const tag = Game.insert ([
      Game ([
        "id",
        Game.props.id.in<{ rows: { id: number}[]}> (({ rows }) => rows.map (r => r.id))
      ]),
      Game (["homeTeamId", "awayTeamId"])
    ]);

    const [query] = tag.compile ({ data: insertData });

    expect (query).toBe (format (`
      insert into public.game (away_team_id, date, home_team_id, id, league_id, result) 
      values ($1, $2, $3, DEFAULT, $4, $5) 
      returning game.away_team_id "awayTeamId", game.date "date", game.home_team_id "homeTeamId", game.id "id", game.league_id "leagueId", game.result "result"
    `));

    const games = await tag ({ data: insertData });
    const game1 = games[0];

    const OneOne = BooleanProp ("one_one", sql`
      game.result = '1-1'
    `);

    expect (games.length).toBe (1);
    expect (game1.homeTeamId).toBe (1);
    expect (game1.awayTeamId).toBe (2);
    expect (Object.keys (game1)).toEqual (["id", "homeTeamId", "awayTeamId"]);

    const tag2 = Game.update ([
      sql<{id: number}>`and game.id = ${p => p.id}`,
      OneOne.eq (true),
      Game ([
        Game.props.id.in<{ rows: { id: number}[]}> (({ rows }) => rows.map (r => r.id)),
        "result"
      ]),
      Game (["id"])
    ]);

    const updateData = { leagueId: 2, result: "2-1" };
    const [query2] = tag2.compile ({ data: updateData, id: game1.id });

    expect (query2).toBe (format (`
      update public.game set league_id = $1, result = $2
      where 1 = 1 
      and game.id = $3 
      and (game.result = '1-1') = $4
      returning game.away_team_id "awayTeamId", game.date "date", game.home_team_id "homeTeamId", game.id "id", game.league_id "leagueId", game.result "result"
    `));

    const games2 = await tag2 ({ data: updateData, id: game1.id });
    const game2 = games2[0];

    expect (games2.length).toBe (1);
    expect (game2.id).toBe (game1.id);
    expect (Object.keys (game2)).toEqual (["id", "result"]);

    const tag3 = Game.delete ([
      sql<{id: number}>`and game.id = ${p => p.id}`,
      OneOne.eq (false)
    ]);

    const [query3] = tag3.compile ({ id: game1.id });

    expect (query3).toBe (format (`
      delete from public.game 
      where 1 = 1 
      and game.id = $1 
      and (game.result = '1-1') = $2
      returning game.away_team_id "awayTeamId", game.date "date", game.home_team_id "homeTeamId", game.id "id", game.league_id "leagueId", game.result "result"
    `));

    const games3 = await tag3 ({ id: game1.id });
    const game3 = games3[0];

    expect (games3.length).toBe (1);
    expect (game3.id).toBe (game1.id);
    expect (Object.keys (game3)).toEqual (["awayTeamId", "date", "homeTeamId", "id", "leagueId", "result" ]);
  });

  test ("update null values and ignore not props", () => {
    const tag = Rating.update ([
      Rating.props.playerId.eq<{ playerId: number }> (p => p.playerId)
    ]);

    const [query, values] = tag.compile ({ playerId: 1, data: { playingGuitar: 10, acceleration: null, dribbling: 70, makingJokes: 30 } as any });

    expect (query).toBe (format (`
      update public.rating set acceleration = $1, dribbling = $2 where 1 = 1 and rating.player_id = $3 
      returning rating.acceleration "acceleration", rating.dribbling "dribbling", rating.finishing "finishing", 
      rating.free_kick "freeKick", rating.player_id "playerId", rating.positioning "positioning", rating.shot_power "shotPower", rating.stamina "stamina", rating.tackling "tackling"
    `));

    expect (values).toEqual ([null, 70, 1]);
  });

  test ("errors", () => {
    let tag = Player.insert ([]);
    tag.nodes = [1] as any;

    expect (() => tag.compile ({} as any))
      .toThrowError (new Error ('Unknown Insertable RQLNode Type: "1"'));

    let tag2 = Player.update ([]);
    tag2.nodes = [1] as any;

    expect (() => tag2.compile ({} as any))
      .toThrowError (new Error ('Unknown Updatable RQLNode Type: "1"'));


    let tag3 = Player.delete ([]);
    tag3.nodes = [1] as any;

    expect (() => tag3.compile ({}))
      .toThrowError (new Error ('Unknown Deletable RQLNode Type: "1"'));

    expect (() => Player.insert ([1 as any]))
      .toThrowError (new Error ('Unknown Insertable Type: "1"'));

    expect (() => Player.update ([1 as any]))
      .toThrowError (new Error ('Unknown Updatable Type: "1"'));

    expect (() => Player.delete ([1 as any]))
      .toThrowError (new Error ('Unknown Deletable Type: "1"'));

    expect (() => Player.insert ([Game (["id"]) as any]))
      .toThrowError (new Error ("When creating an InsertRQLTag, RQLTags are reserved for determining the return type. Therefore, the table associated with the RQLTag must match the table into which you are inserting data"));

    expect (() => Player.update ([Game (["id"]) as any]))
      .toThrowError (new Error ("When creating an UpdateRQLTag, RQLTags are reserved for determining the return type. Therefore, the table associated with the RQLTag must match the table into which you are inserting data"));

  });
});