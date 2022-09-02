import In from "../In";
import Raw from "../Raw";
import Table from "../Table";
import format from "../test/format";
import compileSqlTag from "./compileSqlTag";
import sql from "./sql";

describe ("SqlTag `compileSqlTag` - compile a SqlTag into a tuple of query and values", () => {
  test ("compiled", () => {
    const tag = sql<{limit: number}>`
      select ${Raw.of ("id")}::text, last_name,
        concat(${Raw.of ("first_name")}, ${Raw.of ("' '")}, last_name) as fullname
      from player
      where ${Table.of ("player")}.id ${In.of ([1, 2, 3])}
      ${sql`
        order by ${Raw.of ("player")}.last_name
      `}
      limit ${p => p.limit} offset 1
    `;

    const [query, values] = compileSqlTag (tag, 0, { limit: 30 });

    expect (query).toBe (format (`
      select id::text, last_name,
        concat(first_name, ' ', last_name) as fullname
      from player
      where player.id in ($1,$2,$3)
      order by player.last_name
      limit $4
      offset 1
    `));

    expect (values).toEqual ([1, 2, 3, 30]);
  });
});