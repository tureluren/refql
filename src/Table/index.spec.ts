import Table from ".";

describe ("Table type", () => {
  test ("create Table", () => {
    const player = new Table ("player", "p");

    expect (player.name).toBe ("player");
    expect (player.as).toBe ("p");
  });
});