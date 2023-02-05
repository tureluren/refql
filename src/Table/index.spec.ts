import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import Table, { createTableWithDefaultQuerier } from ".";
import { flEquals } from "../common/consts";
import { Querier } from "../common/types";
import {
  belongsTo, BelongsToMany,
  belongsToMany, hasMany,
  hasOne, Raw, RefNode
} from "../nodes";
import Ref from "../Ref";
import sql from "../SQLTag/sql";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import {
  Game, GamePlayer, Goal, Player,
  Position, Rating, Team
} from "../test/tables";
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
    const Player2 = Table ("public.player");

    expect (Player.name).toBe ("player");
    expect (Player.schema).toBe (undefined);
    expect (Player2.schema).toBe ("public");
    expect (`${Player}`).toBe ("player");
    expect (`${Player2}`).toBe ("public.player");
    expect (Table.isTable (Player)).toBe (true);
    expect (Table.isTable ({})).toBe (false);
  });

  test ("default querier", async () => {
    const Player2 = Table ("player", [], querier);

    const firstPlayer = Player2<{}, Player[]>`
      id last_name
      ${sql`
        limit 1 
      `} 
    `;

    const players = await firstPlayer ();

    expect (players.length).toBe (1);

    expect (Object.keys (players[0])).toEqual (["id", "last_name"]);
  });

  test ("create Table with default querier", async () => {
    const Player2 = createTableWithDefaultQuerier (querier) ("player");

    const firstPlayer = Player2<{}, any[]>`
      id last_name
      ${sql`
        limit 1 
      `} 
    `;

    const players = await firstPlayer ();

    expect (players.length).toBe (1);

    expect (Object.keys (players[0])).toEqual (["id", "last_name"]);
  });

  test ("run", async () => {
    const positions = await Position.run<Position[]> (querier);
    const position1 = positions[0];

    expect (Object.keys (position1)).toEqual (["id", "name"]);
    expect (positions.length).toBe (11);
  });

  test ("invalid table creation", () => {
    expect (() => Table (["player"] as any)).toThrow ("Invalid table: player, expected a string");
    expect (() => Table ("player", {} as any)).toThrow ("Invalid refs: not an Array");
  });

  test ("BelongsTo ref - default ref info", () => {
    const [TeamTable, refMaker] = belongsTo ("public.team");

    expect (TeamTable.equals (Team)).toBe (true);

    const belongsToNode = refMaker (
      Player,
      TeamTable`*`
    );

    const expected = {
      parent: Player,
      as: "team",
      lRef: Ref ("player.team_id", "teamlref"),
      rRef: Ref ("team.id", "teamrref")
    };

    expect (belongsToNode.info).toEqual (expected);
  });

  test ("BelongsTo ref - alias through RQLTag", () => {
    const [TeamTable, refMaker] = belongsTo ("team", { as: "squad" });

    const belongsToNode = refMaker (
      Player,
      TeamTable`*`,
      "crew"
    ) as RefNode;

    const expected = {
      parent: Player,
      as: "crew",
      lRef: Ref ("player.team_id", "crewlref"),
      rRef: Ref ("team.id", "crewrref")
    };

    expect (belongsToNode.info).toEqual (expected);
  });

  test ("BelongsTo ref - provided ref info", () => {
    const [TeamTable, refMaker] = belongsTo ("team", { lRef: "TEAM_ID", rRef: "ID" });

    const belongsToNode = refMaker (
      Player,
      TeamTable`*`
    ) as RefNode;

    const expected = {
      parent: Player,
      as: "team",
      lRef: Ref ("player.TEAM_ID", "teamlref"),
      rRef: Ref ("team.ID", "teamrref")
    };

    expect (belongsToNode.info).toEqual (expected);
  });

  test ("BelongsToMany ref - default ref info", () => {
    const [GameTable, refMaker] = belongsToMany ("game");

    expect (GameTable.equals (Game)).toBe (true);

    const belongsToManyNode = refMaker (
      Player,
      GameTable`*`
    ) as BelongsToMany;


    const expected = {
      parent: Player,
      as: "games",
      lRef: Ref ("player.id", "gameslref"),
      rRef: Ref ("game.id", "gamesrref"),
      lxRef: Ref ("game_player.player_id", "gameslxref"),
      rxRef: Ref ("game_player.game_id", "gamesrxref"),
      xTable: GamePlayer
    };

    expect (belongsToManyNode.info.parent).toEqual (expected.parent);
    expect (belongsToManyNode.info.as).toEqual (expected.as);
    expect (belongsToManyNode.info.lRef).toEqual (expected.lRef);
    expect (belongsToManyNode.info.rRef).toEqual (expected.rRef);
    expect (belongsToManyNode.info.lxRef).toEqual (expected.lxRef);
    expect (belongsToManyNode.info.rxRef).toEqual (expected.rxRef);
    expect (belongsToManyNode.info.xTable.equals (expected.xTable)).toBe (true);
  });

  test ("BelongsToMany ref - default ref - child > parent", () => {
    const [GameTable, refMaker] = belongsToMany ("game");
    const athlete = Table ("athlete");

    const belongsToManyNode = refMaker (
      athlete,
      GameTable`*`
    ) as BelongsToMany;

    const expected = {
      parent: athlete,
      as: "games",
      lRef: Ref ("athlete.id", "gameslref"),
      rRef: Ref ("game.id", "gamesrref"),
      lxRef: Ref ("athlete_game.athlete_id", "gameslxref"),
      rxRef: Ref ("athlete_game.game_id", "gamesrxref"),
      xTable: Table ("athlete_game")
    };

    expect (belongsToManyNode.info.parent).toEqual (expected.parent);
    expect (belongsToManyNode.info.as).toEqual (expected.as);
    expect (belongsToManyNode.info.lRef).toEqual (expected.lRef);
    expect (belongsToManyNode.info.rRef).toEqual (expected.rRef);
    expect (belongsToManyNode.info.lxRef).toEqual (expected.lxRef);
    expect (belongsToManyNode.info.rxRef).toEqual (expected.rxRef);
    expect (belongsToManyNode.info.xTable.equals (expected.xTable)).toBe (true);
  });

  test ("BelongsToMany ref - alias through RQLTag", () => {
    const [GameTable, refMaker] = belongsToMany ("game", { as: "fixtures" });

    const belongsToManyNode = refMaker (
      Player,
      GameTable`*`,
      "matches"
    ) as BelongsToMany;

    const expected = {
      parent: Player,
      as: "matches",
      lRef: Ref ("player.id", "matcheslref"),
      rRef: Ref ("game.id", "matchesrref"),
      lxRef: Ref ("game_player.player_id", "matcheslxref"),
      rxRef: Ref ("game_player.game_id", "matchesrxref"),
      xTable: GamePlayer
    };

    expect (belongsToManyNode.info.parent).toEqual (expected.parent);
    expect (belongsToManyNode.info.as).toEqual (expected.as);
    expect (belongsToManyNode.info.lRef).toEqual (expected.lRef);
    expect (belongsToManyNode.info.rRef).toEqual (expected.rRef);
    expect (belongsToManyNode.info.lxRef).toEqual (expected.lxRef);
    expect (belongsToManyNode.info.rxRef).toEqual (expected.rxRef);
    expect (belongsToManyNode.info.xTable.equals (expected.xTable)).toBe (true);
  });

  test ("BelongsToMany ref - provided ref info", () => {
    const [GameTable, refMaker] = belongsToMany ("game", {
      xTable: "GAME_PLAYER",
      as: "fixtures",
      lRef: "ID",
      rRef: "ID",
      lxRef: "PLAYER_ID",
      rxRef: "GAME_ID"
    });

    const belongsToManyNode = refMaker (
      Player,
      GameTable`*`
    ) as BelongsToMany;


    const expected = {
      parent: Player,
      as: "fixtures",
      lRef: Ref ("player.ID", "fixtureslref"),
      rRef: Ref ("game.ID", "fixturesrref"),
      lxRef: Ref ("GAME_PLAYER.PLAYER_ID", "fixtureslxref"),
      rxRef: Ref ("GAME_PLAYER.GAME_ID", "fixturesrxref"),
      xTable: Table ("GAME_PLAYER")
    };

    expect (belongsToManyNode.info.parent).toEqual (expected.parent);
    expect (belongsToManyNode.info.as).toEqual (expected.as);
    expect (belongsToManyNode.info.lRef).toEqual (expected.lRef);
    expect (belongsToManyNode.info.rRef).toEqual (expected.rRef);
    expect (belongsToManyNode.info.lxRef).toEqual (expected.lxRef);
    expect (belongsToManyNode.info.rxRef).toEqual (expected.rxRef);
    expect (belongsToManyNode.info.xTable.equals (expected.xTable)).toBe (true);
  });

  test ("HasMany ref - default ref info", () => {
    const [GoalTable, refMaker] = hasMany ("goal");

    expect (GoalTable.equals (Goal)).toBe (true);

    const hasManyNode = refMaker (
      Player,
      GoalTable`*`
    ) as RefNode;

    const expected = {
      parent: Player,
      as: "goals",
      lRef: Ref ("player.id", "goalslref"),
      rRef: Ref ("goal.player_id", "goalsrref")
    };

    expect (hasManyNode.info).toEqual (expected);
  });

  test ("HasMany ref - alias through RQLTag", () => {
    const [GoalTable, refMaker] = hasMany ("goal", { as: "points" });

    expect (GoalTable.equals (Goal)).toBe (true);

    const hasManyNode = refMaker (
      Player,
      GoalTable`*`,
      "finishes"
    ) as RefNode;

    const expected = {
      parent: Player,
      as: "finishes",
      lRef: Ref ("player.id", "finisheslref"),
      rRef: Ref ("goal.player_id", "finishesrref")
    };

    expect (hasManyNode.info).toEqual (expected);
  });

  test ("HasMany ref - provided ref info", () => {
    const [GoalTable, refMaker] = hasMany ("goal", {
      as: "points",
      lRef: "ID",
      rRef: "PLAYER_ID"
    });

    const hasManyNode = refMaker (
      Player,
      GoalTable`*`
    ) as RefNode;

    const expected = {
      parent: Player,
      as: "points",
      lRef: Ref ("player.ID", "pointslref"),
      rRef: Ref ("goal.PLAYER_ID", "pointsrref")
    };

    expect (hasManyNode.info).toEqual (expected);
  });

  test ("HasOne ref - default ref info", () => {
    const [RatingTable, refMaker] = hasOne ("rating");

    expect (RatingTable.equals (Rating)).toBe (true);

    const hasOneNode = refMaker (
      Player,
      RatingTable`*`
    ) as RefNode;

    const expected = {
      parent: Player,
      as: "rating",
      lRef: Ref ("player.id", "ratinglref"),
      rRef: Ref ("rating.player_id", "ratingrref")
    };

    expect (hasOneNode.info).toEqual (expected);
  });

  test ("HasOne ref - alias through RQLTag", () => {
    const [RatingTable, refMaker] = hasOne ("rating", { as: "grade" });

    const hasOneNode = refMaker (
      Player,
      RatingTable`*`,
      "score"
    ) as RefNode;

    const expected = {
      parent: Player,
      as: "score",
      lRef: Ref ("player.id", "scorelref"),
      rRef: Ref ("rating.player_id", "scorerref")
    };

    expect (hasOneNode.info).toEqual (expected);
  });

  test ("HasOne ref - provided ref info", () => {
    const [RatingTable, refMaker] = hasOne ("rating", {
      as: "grade",
      lRef: "ID",
      rRef: "PLAYER_ID"
    });

    const hasOneNode = refMaker (
      Player,
      RatingTable`*`
    ) as RefNode;

    const expected = {
      parent: Player,
      as: "grade",
      lRef: Ref ("player.ID", "gradelref"),
      rRef: Ref ("rating.PLAYER_ID", "graderref")
    };

    expect (hasOneNode.info).toEqual (expected);
  });

  test ("Setoid", () => {
    expect (Player[flEquals] (Player)).toBe (true);
    expect (Player[flEquals] (Raw ("player") as any)).toBe (false);
    expect (Player[flEquals] (Team)).toBe (Team[flEquals] (Player));
    expect (Player[flEquals] (Player) && Player[flEquals] (Player)).toBe (Player[flEquals] (Player));
  });
});