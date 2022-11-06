import Table from ".";

describe ("Table type", () => {
  const refsF = () => ({});
  test ("create Table", () => {
    const player = Table ("public.player", refsF);
    console.log (player);
    console.log (player.bind);
    console.log (player.compile);
    console.log (player.name);
    player`
      player { * } 
    `;
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