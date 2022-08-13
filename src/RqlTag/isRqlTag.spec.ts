import RqlTag from ".";
import sql from "../SqlTag/sql";
import isRqlTag from "./isRqlTag";

describe ("RqlTag `isRqlTag` - detects if a given value is a RqlTag", () => {
  test ("RQL detected", () => {
    const string = "player { id lastName $ }";
    const keys = [sql`where id = 1`];
    const rqlTag = new RqlTag (string, keys);

    expect (isRqlTag (rqlTag)).toBe (true);
  });
});