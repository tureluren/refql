import Table from ".";

describe ("Table type", () => {
  test ("create Table", () => {
    const player = Table ("player", "p", "public");

    expect (player.name).toBe ("player");
    expect (player.as).toBe ("p");
    expect (player.schema).toBe ("public");
    expect (`${player}`).toBe ("Table (player, p, public)");
  });
});