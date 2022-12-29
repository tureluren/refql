import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import Table from ".";
import { flEquals } from "../common/consts";
import { Querier } from "../common/types";
import {
  belongsTo, BelongsToMany,
  belongsToMany, hasMany,
  hasOne, Raw, RefNode
} from "../nodes";
import Ref from "../Ref";
import { Position } from "../soccer";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import {
  game, gamePlayer, goal, player,
  position, rating, team
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
    const player2 = Table ("public.player");

    expect (player.name).toBe ("player");
    expect (player.schema).toBe (undefined);
    expect (player2.schema).toBe ("public");
    expect (`${player}`).toBe ("player");
    expect (`${player2}`).toBe ("public.player");
    expect (Table.isTable (player)).toBe (true);
    expect (Table.isTable ({})).toBe (false);
  });

  test ("run", async () => {
    const positions = await position.run<Position> (querier);
    const position1 = positions[0];

    expect (Object.keys (position1)).toEqual (["id", "name"]);
    expect (positions.length).toBe (11);
  });

  test ("BelongsTo ref - default ref info", () => {
    const [teamTable, refMaker] = belongsTo ("public.team");

    expect (teamTable.equals (team)).toBe (true);

    const belongsToNode = refMaker (
      player,
      teamTable`*`
    ) as RefNode<unknown>;

    const expected = {
      parent: player,
      as: "team",
      lRef: Ref ("player.team_id", "teamlref"),
      rRef: Ref ("team.id", "teamrref")
    };

    expect (belongsToNode.info).toEqual (expected);
  });

  test ("BelongsTo ref - alias through RQLTag", () => {
    const [teamTable, refMaker] = belongsTo ("team", { as: "squad" });

    const belongsToNode = refMaker (
      player,
      teamTable`*`,
      "crew"
    ) as RefNode<unknown>;

    const expected = {
      parent: player,
      as: "crew",
      lRef: Ref ("player.team_id", "crewlref"),
      rRef: Ref ("team.id", "crewrref")
    };

    expect (belongsToNode.info).toEqual (expected);
  });

  test ("BelongsTo ref - provided ref info", () => {
    const [teamTable, refMaker] = belongsTo ("team", { lRef: "TEAM_ID", rRef: "ID" });

    const belongsToNode = refMaker (
      player,
      teamTable`*`
    ) as RefNode<unknown>;

    const expected = {
      parent: player,
      as: "team",
      lRef: Ref ("player.TEAM_ID", "teamlref"),
      rRef: Ref ("team.ID", "teamrref")
    };

    expect (belongsToNode.info).toEqual (expected);
  });

  test ("BelongsToMany ref - default ref info", () => {
    const [gamesTable, refMaker] = belongsToMany ("game");

    expect (gamesTable.equals (game)).toBe (true);

    const belongsToManyNode = refMaker (
      player,
      gamesTable`*`
    ) as BelongsToMany<unknown>;


    const expected = {
      parent: player,
      as: "games",
      lRef: Ref ("player.id", "gameslref"),
      rRef: Ref ("game.id", "gamesrref"),
      lxRef: Ref ("game_player.player_id", "gameslxref"),
      rxRef: Ref ("game_player.game_id", "gamesrxref"),
      xTable: gamePlayer
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
    const [gamesTable, refMaker] = belongsToMany ("game");
    const athlete = Table ("athlete");

    const belongsToManyNode = refMaker (
      athlete,
      gamesTable`*`
    ) as BelongsToMany<unknown>;

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
    const [gamesTable, refMaker] = belongsToMany ("game", { as: "fixtures" });

    const belongsToManyNode = refMaker (
      player,
      gamesTable`*`,
      "matches"
    ) as BelongsToMany<unknown>;


    const expected = {
      parent: player,
      as: "matches",
      lRef: Ref ("player.id", "matcheslref"),
      rRef: Ref ("game.id", "matchesrref"),
      lxRef: Ref ("game_player.player_id", "matcheslxref"),
      rxRef: Ref ("game_player.game_id", "matchesrxref"),
      xTable: gamePlayer
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
    const [gamesTable, refMaker] = belongsToMany ("game", {
      xTable: "GAME_PLAYER",
      as: "fixtures",
      lRef: "ID",
      rRef: "ID",
      lxRef: "PLAYER_ID",
      rxRef: "GAME_ID"
    });

    const belongsToManyNode = refMaker (
      player,
      gamesTable`*`
    ) as BelongsToMany<unknown>;


    const expected = {
      parent: player,
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
    const [goalTable, refMaker] = hasMany ("goal");

    expect (goalTable.equals (goal)).toBe (true);

    const hasManyNode = refMaker (
      player,
      goalTable`*`
    ) as RefNode<unknown>;

    const expected = {
      parent: player,
      as: "goals",
      lRef: Ref ("player.id", "goalslref"),
      rRef: Ref ("goal.player_id", "goalsrref")
    };

    expect (hasManyNode.info).toEqual (expected);
  });

  test ("HasMany ref - alias through RQLTag", () => {
    const [goalTable, refMaker] = hasMany ("goal", { as: "points" });

    expect (goalTable.equals (goal)).toBe (true);

    const hasManyNode = refMaker (
      player,
      goalTable`*`,
      "finishes"
    ) as RefNode<unknown>;

    const expected = {
      parent: player,
      as: "finishes",
      lRef: Ref ("player.id", "finisheslref"),
      rRef: Ref ("goal.player_id", "finishesrref")
    };

    expect (hasManyNode.info).toEqual (expected);
  });

  test ("HasMany ref - provided ref info", () => {
    const [goalTable, refMaker] = hasMany ("goal", {
      as: "points",
      lRef: "ID",
      rRef: "PLAYER_ID"
    });

    const hasManyNode = refMaker (
      player,
      goalTable`*`
    ) as RefNode<unknown>;

    const expected = {
      parent: player,
      as: "points",
      lRef: Ref ("player.ID", "pointslref"),
      rRef: Ref ("goal.PLAYER_ID", "pointsrref")
    };

    expect (hasManyNode.info).toEqual (expected);
  });

  test ("HasOne ref - default ref info", () => {
    const [ratingTable, refMaker] = hasOne ("rating");

    expect (ratingTable.equals (rating)).toBe (true);

    const hasOneNode = refMaker (
      player,
      ratingTable`*`
    ) as RefNode<unknown>;

    const expected = {
      parent: player,
      as: "rating",
      lRef: Ref ("player.id", "ratinglref"),
      rRef: Ref ("rating.player_id", "ratingrref")
    };

    expect (hasOneNode.info).toEqual (expected);
  });

  test ("HasOne ref - alias through RQLTag", () => {
    const [ratingTable, refMaker] = hasOne ("rating", { as: "grade" });

    const hasOneNode = refMaker (
      player,
      ratingTable`*`,
      "score"
    ) as RefNode<unknown>;

    const expected = {
      parent: player,
      as: "score",
      lRef: Ref ("player.id", "scorelref"),
      rRef: Ref ("rating.player_id", "scorerref")
    };

    expect (hasOneNode.info).toEqual (expected);
  });

  test ("HasOne ref - provided ref info", () => {
    const [ratingTable, refMaker] = hasOne ("rating", {
      as: "grade",
      lRef: "ID",
      rRef: "PLAYER_ID"
    });

    const hasOneNode = refMaker (
      player,
      ratingTable`*`
    ) as RefNode<unknown>;

    const expected = {
      parent: player,
      as: "grade",
      lRef: Ref ("player.ID", "gradelref"),
      rRef: Ref ("rating.PLAYER_ID", "graderref")
    };

    expect (hasOneNode.info).toEqual (expected);
  });

  test ("Setoid", () => {
    expect (player[flEquals] (player)).toBe (true);
    expect (player[flEquals] (Raw ("player") as any)).toBe (false);
    expect (player[flEquals] (team)).toBe (team[flEquals] (player));
    expect (player[flEquals] (player) && player[flEquals] (player)).toBe (player[flEquals] (player));
  });
});