import RQLTag from ".";
import sql from "../SQLTag/sql";
import isRQLTag from "./isRQLTag";

describe ("RQLTag `isRQLTag` - detects if a given value is a RQLTag", () => {
  test ("RQL detected", () => {
    const string = "player { id lastName $ }";
    const keys = [sql`where id = 1`];
    const rqlTag = RQLTag (string, keys);

    expect (isRQLTag (rqlTag)).toBe (true);
  });
});