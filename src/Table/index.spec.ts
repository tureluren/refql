import mariaDB from "mariadb";
import Table from ".";
import { Querier } from "../common/types";
import { BelongsTo, BelongsToMany, HasMany } from "../nodes";
import HasOne from "../nodes/HasOne";
import mariaDBQuerier from "../test/mariaDBQuerier";
import { Player, Rating, Team } from "../test/tables";
import userConfig from "../test/userConfig";

describe ("Table type", () => {

  let pool: any;
  let querier: Querier<any>;

  pool = mariaDB.createPool (userConfig ("mariadb"));
  querier = mariaDBQuerier (pool);

  test ("create Table", async () => {
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

  // setoid
  // semigroup
});