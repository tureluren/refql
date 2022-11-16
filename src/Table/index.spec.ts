import mariaDB from "mariadb";
import Table from ".";
import { Querier } from "../common/types";
import { BelongsTo, BelongsToMany, HasMany } from "../nodes";
import HasOne from "../nodes/HasOne";
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
  const Team = Table ("team");
  const Rating = Table ("rating");

  const refsF = [
    () => BelongsTo (Team, {
      as: "team",
      lRef: "team_id",
      rRef: "id"
    }),
    () => HasOne (Rating, {
      as: "rating",
      lRef: "id",
      rRef: "player_id"
    }),
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
      xTable: Table ("player_game")
    })
  ];

  test ("create Table", async () => {
    const Player = Table ("player", refsF);

    const qry = Player<{id: number}>`
      id 
      last_name 
      ${Team<{limit: number}>`
        id
        name
      `}
      ${Rating`
        player_id
        dribbling
      `}
    `;

    const playerke = await qry.run (querier, { id: 1 });
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