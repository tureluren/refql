import mariaDB from "mariadb";
import Table from ".";
import { Querier } from "../common/types";
import { All, BelongsTo, BelongsToMany, HasMany } from "../nodes";
import HasOne from "../nodes/HasOne";
import mariaDBQuerier from "../test/mariaDBQuerier";
import { player, rating, team } from "../test/tables";
import userConfig from "../test/userConfig";
import belongsTo from "./belongsTo";
import belongsToMany from "./belongsToMany";
import hasMany from "./hasMany";
import hasOne from "./hasOne";

describe ("Table type", () => {

  // let pool: any;
  // let querier: Querier<any>;

  // pool = mariaDB.createPool (userConfig ("mariadb"));
  // querier = mariaDBQuerier (pool);

  test ("create Table", async () => {
    // const qry = player<{id: number}>`
    //   id
    //   last_name
    //   ${team<{limit: number}>`
    //     id
    //     name
    //   `}
    //   ${rating`
    //     player_id
    //     dribbling
    //   `}
    // `;

    // const playerke = await qry.run (querier, { id: 1 });
    // console.log (playerke[0]);

    // player;

    // const player2 = Table ("public.player", refsF);

    // expect (player.name).toBe ("player");
    // expect (player.as).toBe ("player");
    // expect (player.schema).toBe (undefined);
    // expect (player2.name).toBe ("player");
    // expect (player2.as).toBe ("player");
    // expect (player2.schema).toBe ("public");
    // // expect (`${player}`).toBe ("Table (player, p, public)");
    // expect (Table.isTable (player)).toBe (true);
    // expect (Table.isTable ({})).toBe (false);
  });

  test ("BelongsTo ref - default ref info", () => {
    const [teamTable, refMaker] = belongsTo ("team");

    expect (teamTable.equals (Table ("team"))).toBe (true);

    const belongsToNode = refMaker (
      Table ("player"),
      [All ("*")]
    );

    const expected = BelongsTo (
      teamTable,
      { as: "team", lRef: "team_id", rRef: "id" },
      [All ("*")]
    );

    expect (belongsToNode).toEqual (expected);
  });

  test ("BelongsTo ref - alias through RQLTag", () => {
    const [teamTable, refMaker] = belongsTo ("team", { as: "squad" });

    const belongsToNode = refMaker (
      Table ("player"),
      [All ("*")],
      "crew"
    );

    const expected = BelongsTo (
      teamTable,
      { as: "crew", lRef: "team_id", rRef: "id" },
      [All ("*")]
    );

    expect (belongsToNode).toEqual (expected);
  });

  test ("BelongsTo ref - provided ref info", () => {
    const [teamTable, refMaker] = belongsTo ("team", { lRef: "TEAM_ID", rRef: "ID" });

    const belongsToNode = refMaker (
      Table ("player"),
      [All ("*")]
    );

    const expected = BelongsTo (
      teamTable,
      { as: "team", lRef: "TEAM_ID", rRef: "ID" },
      [All ("*")]
    );

    expect (belongsToNode).toEqual (expected);
  });

  test ("BelongsToMany ref - default ref info", () => {
    const [gamesTable, refMaker] = belongsToMany ("game");

    expect (gamesTable.equals (Table ("game"))).toBe (true);

    const belongsToManyNode = refMaker (
      Table ("player"),
      [All ("*")]
    );

    const expected = BelongsToMany (
      gamesTable,
      {
        as: "games",
        lRef: "id",
        rRef: "id",
        lxRef: "player_id",
        rxRef: "game_id",
        xTable: Table ("game_player")
      },
      [All ("*")]
    );

    expect (JSON.stringify (belongsToManyNode)).toBe (JSON.stringify (expected));
  });

  test ("BelongsToMany ref - alias through RQLTag", () => {
    const [gamesTable, refMaker] = belongsToMany ("game", { as: "fixtures" });

    const belongsToManyNode = refMaker (
      Table ("player"),
      [All ("*")],
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
        xTable: Table ("game_player")
      },
      [All ("*")]
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
      Table ("player"),
      [All ("*")]
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
      [All ("*")]
    );

    expect (JSON.stringify (belongsToManyNode)).toBe (JSON.stringify (expected));
  });

  test ("HasMany ref - default ref info", () => {
    const [goalTable, refMaker] = hasMany ("goal");

    expect (goalTable.equals (Table ("goal"))).toBe (true);

    const hasManyNode = refMaker (
      Table ("player"),
      [All ("*")]
    );

    const expected = HasMany (
      goalTable,
      { as: "goals", lRef: "id", rRef: "player_id" },
      [All ("*")]
    );

    expect (hasManyNode).toEqual (expected);
  });

  test ("HasMany ref - alias through RQLTag", () => {
    const [goalTable, refMaker] = hasMany ("goal", { as: "points" });

    const hasManyNode = refMaker (
      Table ("player"),
      [All ("*")],
      "finishes"
    );

    const expected = HasMany (
      goalTable,
      { as: "finishes", lRef: "id", rRef: "player_id" },
      [All ("*")]
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
      Table ("player"),
      [All ("*")]
    );

    const expected = HasMany (
      goalTable,
      { as: "points", lRef: "ID", rRef: "PLAYER_ID" },
      [All ("*")]
    );

    expect (hasManyNode).toEqual (expected);
  });

  test ("HasOne ref - default ref info", () => {
    const [ratingTable, refMaker] = hasOne ("rating");

    expect (ratingTable.equals (Table ("rating"))).toBe (true);

    const hasOneNode = refMaker (
      Table ("player"),
      [All ("*")]
    );

    const expected = HasOne (
      ratingTable,
      { as: "rating", lRef: "id", rRef: "player_id" },
      [All ("*")]
    );

    expect (hasOneNode).toEqual (expected);
  });

  test ("HasOne ref - alias through RQLTag", () => {
    const [ratingTable, refMaker] = hasOne ("rating", { as: "grade" });

    expect (ratingTable.equals (Table ("rating"))).toBe (true);

    const hasOneNode = refMaker (
      Table ("player"),
      [All ("*")],
      "score"
    );

    const expected = HasOne (
      ratingTable,
      { as: "score", lRef: "id", rRef: "player_id" },
      [All ("*")]
    );

    expect (hasOneNode).toEqual (expected);
  });

  test ("HasOne ref - provided ref info", () => {
    const [ratingTable, refMaker] = hasOne ("rating", {
      as: "grade",
      lRef: "ID",
      rRef: "PLAYER_ID"
    });

    expect (ratingTable.equals (Table ("rating"))).toBe (true);

    const hasOneNode = refMaker (
      Table ("player"),
      [All ("*")]
    );

    const expected = HasOne (
      ratingTable,
      { as: "grade", lRef: "ID", rRef: "PLAYER_ID" },
      [All ("*")]
    );

    expect (hasOneNode).toEqual (expected);
  });


  // setoid
  // semigroup
});