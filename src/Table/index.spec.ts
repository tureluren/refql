import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import Table from ".";
import { flEquals } from "../common/consts";
import { Querier } from "../common/types";
import { all, BelongsTo, BelongsToMany, HasMany } from "../nodes";
import HasOne from "../nodes/HasOne";
import { Player } from "../soccer";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import { game, gamePlayer, goal, player, position, rating, team } from "../test/tables";
import userConfig from "../test/userConfig";
import belongsTo from "./belongsTo";
import belongsToMany from "./belongsToMany";
import hasMany from "./hasMany";
import hasOne from "./hasOne";

describe ("Table type", () => {
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
    const positions = await position.run (querier);
    const position1 = positions[0];

    expect (Object.keys (position1)).toEqual (["id", "name"]);
    expect (positions.length).toBe (11);
  });

  test ("BelongsTo ref - default ref info", () => {
    const [teamTable, refMaker] = belongsTo ("public.team");

    expect (teamTable.equals (team)).toBe (true);

    const belongsToNode = refMaker (
      player,
      [all]
    );

    const expected = BelongsTo (
      teamTable,
      { as: "team", lRef: "team_id", rRef: "id" },
      [all]
    );

    expect (belongsToNode).toEqual (expected);
  });

  test ("BelongsTo ref - alias through RQLTag", () => {
    const [teamTable, refMaker] = belongsTo ("team", { as: "squad" });

    const belongsToNode = refMaker (
      player,
      [all],
      "crew"
    );

    const expected = BelongsTo (
      teamTable,
      { as: "crew", lRef: "team_id", rRef: "id" },
      [all]
    );

    expect (belongsToNode).toEqual (expected);
  });

  test ("BelongsTo ref - provided ref info", () => {
    const [teamTable, refMaker] = belongsTo ("team", { lRef: "TEAM_ID", rRef: "ID" });

    const belongsToNode = refMaker (
      player,
      [all]
    );

    const expected = BelongsTo (
      teamTable,
      { as: "team", lRef: "TEAM_ID", rRef: "ID" },
      [all]
    );

    expect (belongsToNode).toEqual (expected);
  });

  test ("BelongsToMany ref - default ref info", () => {
    const [gamesTable, refMaker] = belongsToMany ("game");

    expect (gamesTable.equals (game)).toBe (true);

    const belongsToManyNode = refMaker (
      player,
      [all]
    );

    const expected = BelongsToMany (
      gamesTable,
      {
        as: "games",
        lRef: "id",
        rRef: "id",
        lxRef: "player_id",
        rxRef: "game_id",
        xTable: gamePlayer
      },
      [all]
    );

    expect (JSON.stringify (belongsToManyNode)).toBe (JSON.stringify (expected));
  });

  test ("BelongsToMany ref - default ref - child > parent", () => {
    const [gamesTable, refMaker] = belongsToMany ("game");

    expect (gamesTable.equals (game)).toBe (true);

    const belongsToManyNode = refMaker (
      Table ("athlete"),
      [all]
    );

    const expected = BelongsToMany (
      gamesTable,
      {
        as: "games",
        lRef: "id",
        rRef: "id",
        lxRef: "athlete_id",
        rxRef: "game_id",
        xTable: Table ("athlete_game")
      },
      [all]
    );

    expect (JSON.stringify (belongsToManyNode)).toBe (JSON.stringify (expected));
  });


  test ("BelongsToMany ref - alias through RQLTag", () => {
    const [gamesTable, refMaker] = belongsToMany ("game", { as: "fixtures" });

    const belongsToManyNode = refMaker (
      player,
      [all],
      "matches"
    );

    const expected = BelongsToMany (
      gamesTable,
      {
        as: "matches",
        lRef: "id",
        rRef: "id",
        lxRef: "player_id",
        rxRef: "game_id",
        xTable: gamePlayer
      },
      [all]
    );

    expect (JSON.stringify (belongsToManyNode)).toBe (JSON.stringify (expected));
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
      [all]
    );

    const expected = BelongsToMany (
      gamesTable,
      {
        as: "fixtures",
        lRef: "ID",
        rRef: "ID",
        lxRef: "PLAYER_ID",
        rxRef: "GAME_ID",
        xTable: Table ("GAME_PLAYER")
      },
      [all]
    );

    expect (JSON.stringify (belongsToManyNode)).toBe (JSON.stringify (expected));
  });

  test ("HasMany ref - default ref info", () => {
    const [goalTable, refMaker] = hasMany ("goal");

    expect (goalTable.equals (goal)).toBe (true);

    const hasManyNode = refMaker (
      player,
      [all]
    );

    const expected = HasMany (
      goalTable,
      { as: "goals", lRef: "id", rRef: "player_id" },
      [all]
    );

    expect (hasManyNode).toEqual (expected);
  });

  test ("HasMany ref - alias through RQLTag", () => {
    const [goalTable, refMaker] = hasMany ("goal", { as: "points" });

    const hasManyNode = refMaker (
      player,
      [all],
      "finishes"
    );

    const expected = HasMany (
      goalTable,
      { as: "finishes", lRef: "id", rRef: "player_id" },
      [all]
    );

    expect (hasManyNode).toEqual (expected);
  });

  test ("HasMany ref - provided ref info", () => {
    const [goalTable, refMaker] = hasMany ("goal", {
      as: "points",
      lRef: "ID",
      rRef: "PLAYER_ID"
    });

    const hasManyNode = refMaker (
      player,
      [all]
    );

    const expected = HasMany (
      goalTable,
      { as: "points", lRef: "ID", rRef: "PLAYER_ID" },
      [all]
    );

    expect (hasManyNode).toEqual (expected);
  });

  test ("HasOne ref - default ref info", () => {
    const [ratingTable, refMaker] = hasOne ("rating");

    expect (ratingTable.equals (rating)).toBe (true);

    const hasOneNode = refMaker (
      player,
      [all]
    );

    const expected = HasOne (
      ratingTable,
      { as: "rating", lRef: "id", rRef: "player_id" },
      [all]
    );

    expect (hasOneNode).toEqual (expected);
  });

  test ("HasOne ref - alias through RQLTag", () => {
    const [ratingTable, refMaker] = hasOne ("rating", { as: "grade" });

    expect (ratingTable.equals (rating)).toBe (true);

    const hasOneNode = refMaker (
      player,
      [all],
      "score"
    );

    const expected = HasOne (
      ratingTable,
      { as: "score", lRef: "id", rRef: "player_id" },
      [all]
    );

    expect (hasOneNode).toEqual (expected);
  });

  test ("HasOne ref - provided ref info", () => {
    const [ratingTable, refMaker] = hasOne ("rating", {
      as: "grade",
      lRef: "ID",
      rRef: "PLAYER_ID"
    });

    expect (ratingTable.equals (rating)).toBe (true);

    const hasOneNode = refMaker (
      player,
      [all]
    );

    const expected = HasOne (
      ratingTable,
      { as: "grade", lRef: "ID", rRef: "PLAYER_ID" },
      [all]
    );

    expect (hasOneNode).toEqual (expected);
  });

  test ("Setoid", () => {
    expect (player[flEquals] (player)).toBe (true);
    expect (player[flEquals] (team)).toBe (team[flEquals] (player));
    expect (player[flEquals] (player) && player[flEquals] (player)).toBe (player[flEquals] (player));
  });
});