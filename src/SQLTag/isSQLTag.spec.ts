import SQLTag from ".";
import isSQLTag from "./isSQLTag";

describe ("SQLTag `isSQLTag` - detects if a given value is a SQLTag", () => {
  test ("SQL detected", () => {
    const strings = ["where id = ", "order by last_name"];
    const keys = [1];
    const sqlTag = new SQLTag (strings as any, keys);

    expect (isSQLTag (sqlTag)).toBe (true);
  });
});