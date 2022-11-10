import Table from ".";
import { HasMany } from "../nodes";

describe ("Table type", () => {
  const Goal = Table ("public.goal");

  const refsF = [
    () => HasMany (Goal, {
      as: "goals",
      lRef: "id",
      rRef: "player_id"
    })
  ];

  test ("create Table", () => {
    const Player = Table ("public.player", refsF);

    const qry = Player`
      id last_name ${Goal`id name`}
    `;

    qry.run ((query, values) => {
      console.log (query);
      return Promise.resolve ([]);
    }, {});

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