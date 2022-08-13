import format from "../test/format";
import compileSqlTag from "./compileSqlTag";
import sql from "./sql";

describe ("SqlTag `compileSqlTag` - compile a SqlTag into a tuple of query and values", () => {
  test ("SqlTag compiled", () => {
    const tag = sql`
      select * from "player"
      where id = ${1} 
    `;

    const [query, values] = compileSqlTag (tag, 0);

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

    const [query, values] = compileSqlTag (tag, 0);

    expect (query).toBe (format (`
      select * from "player" where id in ($1,$2,$3)
    `));

    expect (values).toEqual ([1, 2, 3]);
  });
});