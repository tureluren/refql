import isSQLTag from "./isSQLTag";
import sql from "./sql";

describe ("SQLTag `sql` - tagged template to create a SQLTag", () => {
  test ("create SQLTag", () => {
    const sqlTag = sql`where id = ${1} order by last_name`;

    expect (isSQLTag (sqlTag)).toBe (true);
  });
});