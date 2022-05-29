import format from "../test/format";
import compileSQLTag from "./compileSQLTag";
import sql from "./sql";

describe ("SQLTag `compileSQLTag` - compile a SQLTag into a tuple of query and values", () => {
  test ("SQLTag compiled", () => {
    const tag = sql`
      select * from "player"
      where id = ${1} 
    `;

    const [query, values] = compileSQLTag (tag, 0);

    expect (query).toBe (format (`
      select * from "player" where id = $1
    `));

    expect (values).toEqual ([1]);
  });

  test ("Where in queries", () => {
    const tag = sql`
      select * from "player"
      where id in (${[1, 2, 3]})
    `;

    const [query, values] = compileSQLTag (tag, 0);

    expect (query).toBe (format (`
      select * from "player" where id in ($1,$2,$3)
    `));

    expect (values).toEqual ([1, 2, 3]);
  });
});