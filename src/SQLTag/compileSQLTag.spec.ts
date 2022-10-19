import In from "../In";
import Raw from "../Raw";
import Select from "../Select";
import Table from "../Table";
import format from "../test/format";
import compileSQLTag from "./compileSQLTag";
import sql from "./sql";

describe ("SQLTag `compileSQLTag` - compile a SQLTag into a tuple of query and values", () => {
  test ("compiled", () => {
    const tag = sql<{limit: number}>`
      select ${Raw ("id")}::text, last_name,
        concat(${Raw ("first_name")}, ${Raw ("' '")}, last_name) as fullname
      from ${Table ("player", "player", "public")}
      where ${Table ("player")}.id ${In ([1, 2, 3])}
      ${sql`
        order by ${Raw ("player")}.last_name
      `}
      limit ${p => p.limit} offset 1
    `;

    const [query, values] = compileSQLTag (tag, 0, { limit: 30 });

    expect (query).toBe (format (`
      select id::text, last_name,
        concat(first_name, ' ', last_name) as fullname
      from public.player player
      where player.id in ($1,$2,$3)
      order by player.last_name
      limit $4
      offset 1
    `));

    expect (values).toEqual ([1, 2, 3, 30]);
  });

  test ("select", () => {
    const tag = sql`
      ${Select ("player", ["first_name", "last_name"])}
    `;

    const [query, values] = compileSQLTag (tag, 0, { limit: 30 });

    expect (query).toBe (format (`
      select player.first_name, player.last_name
      from player player 
    `));

    expect (values).toEqual ([]);
  });
});