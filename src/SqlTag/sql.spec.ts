import isSqlTag from "./isSqlTag";
import sql from "./sql";

describe ("SqlTag `sql` - tagged template to create a SqlTag", () => {
  test ("create SqlTag", () => {
    const sqlTag = sql`where id = ${1} order by last_name`;

    expect (isSqlTag (sqlTag)).toBe (true);
  });
});