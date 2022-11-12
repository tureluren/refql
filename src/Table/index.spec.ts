import mariaDB from "mariadb";
import Table from ".";
import { Querier } from "../common/types";
import { BelongsToMany, HasMany } from "../nodes";
import { Player } from "../soccer";
import mariaDBQuerier from "../test/mariaDBQuerier";
import userConfig from "../test/userConfig";

describe ("Table type", () => {

  let pool: any;
  let querier: Querier<Player>;

  pool = mariaDB.createPool (userConfig ("mariadb"));
  querier = mariaDBQuerier (pool);

  const Goal = Table ("goal");
  const Game = Table ("game");

  const refsF = [
    () => HasMany (Goal, {
      as: "goals",
      lRef: "id",
      rRef: "player_id"
    }),
    () => BelongsToMany (Game, {
      as: "games",
      lRef: "id",
      rxRef: "player_id",
      lxRef: "game_id",
      rRef: "id",
      xTable: "player_game"
    })
  ];

  test ("create Table", async () => {
    const Player = Table ("player", refsF);

    const qry = Player`
      id last_name 
      ${Goal`id minute`}
      ${Game`id result`}
    `;

    const playerke = await qry.run (querier, {});
    console.log (playerke[0]);

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
});