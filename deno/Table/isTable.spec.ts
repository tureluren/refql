import Table from ".";
import isTable from "./isTable";

describe ("Table `isTable` - detects if a given value is a Table", () => {
  test ("Table detected", () => {
    const player = new Table ("player", "p");

    expect (isTable (player)).toBe (true);
  });
});