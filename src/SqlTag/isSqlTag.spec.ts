import SqlTag from ".";
import isSqlTag from "./isSqlTag";

describe ("SqlTag `isSqlTag` - detects if a given value is a SqlTag", () => {
  test ("SQL detected", () => {
    const strings = ["where id = ", "order by last_name"];
    const keys = [1];
    const sqlTag = new SqlTag (strings as any, keys);

    expect (isSqlTag (sqlTag)).toBe (true);
  });
});