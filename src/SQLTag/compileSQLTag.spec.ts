import In from "../In";
import Insert from "../Insert";
import Raw from "../Raw";
import Select from "../Select";
import Table from "../Table";
import format from "../test/format";
import Update from "../Update";
import compileSQLTag from "./compileSQLTag";
import sql from "./sql";

describe ("SQLTag `compileSQLTag` - compile a SQLTag into a tuple of query and values", () => {
  test ("compiled", () => {
    const tag = sql<{limit: number}>`
      select ${Raw ("id")}::text, last_name,
        concat(${Raw ("first_name")}, ${Raw ("' '")}, last_name) as fullname
      from ${Table ("public.player")}
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
      from public.player
      where player.id in ($1, $2, $3)
      order by player.last_name
      limit $4
      offset 1
    `));

    expect (values).toEqual ([1, 2, 3, 30]);
  });

  test ("select", () => {
    const tag = sql`
      ${Select (Table ("player"), ["first_name", "last_name"])}
    `;

    const [query, values] = compileSQLTag (tag, 0, {});

    expect (query).toBe (format (`
      select player.first_name, player.last_name
      from player
    `));

    expect (values).toEqual ([]);
  });

  test ("insert", () => {
    const tag = sql`
      ${Insert (Table ("player"), ["first_name", "last_name"], [{ first_name: "John", last_name: "Doe" }])}
    `;

    const [query, values] = compileSQLTag (tag, 0, {});

    expect (query).toBe (format (`
      insert into player (first_name, last_name)
      values ($1, $2)
    `));

    expect (values).toEqual (["John", "Doe"]);
  });

  test ("update", () => {
    const tag = sql`
      ${Update (Table ("player"), ["first_name", "last_name"], { first_name: "John", last_name: "Doe" })}
      where id = 1
    `;

    const [query, values] = compileSQLTag (tag, 0, {});

    expect (query).toBe (format (`
      update player
      set first_name = $1, last_name = $2
      where id = 1
    `));

    expect (values).toEqual (["John", "Doe"]);
  });
});