import SQLTag from ".";
import raw from "../Raw/raw";
import belongsTo from "../Rel/belongsTo";
import rql from "../RQLTag/rql";
import subselect from "../Sub/subselect";
import format from "../test/format";
import refQLConfig from "../test/refQLConfig";
import sql from "./sql";

describe ("SQLTag type", () => {
  test ("create SQLTag", () => {
    const strings = ["where id = ", "order by last_name"];
    const keys = [1];
    const sqlTag = SQLTag (strings as any, keys);

    expect (sqlTag.strings).toEqual (strings);
    expect (sqlTag.keys).toEqual (keys);
  });

  test ("interpret sqlTag", () => {
    const sqlSnippet = sql`
      select id, last_name
      from player
    `;

    const [query, values] = sqlSnippet.interpret ();

    expect (query).toBe (format (`
      select id, last_name
      from player
    `));

    expect (values).toEqual ([]);
  });

  test ("interpret values", () => {
    const sqlSnippet = sql`
      select p.id, p.last_name, g.own_goal
      from player p
      join goal g on g.player_id = p.id
      where p.id = ${1}
      and g.own_goal = ${true}
      and p.last_name = ${"Doe"}
    `;

    const [query, values] = sqlSnippet.interpret ();

    expect (query).toBe (format (`
      select p.id, p.last_name, g.own_goal
      from player p
      join goal g on g.player_id = p.id
      where p.id = $1
      and g.own_goal = $2
      and p.last_name = $3
    `));

    expect (values).toEqual ([1, true, "Doe"]);
  });

  test ("interpret nested sql", () => {
    const sqlSnippet = sql`
      select id, last_name
      from player
      ${sql`
        where last_name like 'A%' 
      `}
      ${sql`
        order by last_name
        ${sql`
          offset 0 
          limit ${10}
        `} 
      `}
    `;

    const [query, values] = sqlSnippet.interpret ();

    expect (query).toBe (format (`
      select id, last_name
      from player
      where last_name like 'A%' 
      order by last_name
      offset 0 
      limit $1
    `));

    expect (values).toEqual ([10]);
  });

  test ("interpret raw values", () => {
    const sqlSnippet = sql`
      select id, last_name
      from player
      where ${raw ("id")}::text = ${"1"}
      or ${raw ("last_name like 'A%'")}
      order by ${raw ("last_name, first_name")}
    `;

    const [query, values] = sqlSnippet.interpret ();

    expect (query).toBe (format (`
      select id, last_name
      from player
      where id::text = $1 
      or last_name like 'A%'
      order by last_name, first_name
    `));

    expect (values).toEqual (["1"]);
  });

  test ("invalid SQLTag", () => {
    const sqlSnippet = sql`
      select id, last_name
      from player
      where id = ${() => 1}
    `;

    expect (() => sqlSnippet.interpret ())
      .toThrowError (new Error ("You can't use Functions inside SQL Tags"));

    const sqlSnippet2 = sql`
      ${rql`player { id last_name }`}
      where id = 1
    `;

    expect (() => sqlSnippet2.interpret ())
      .toThrowError (new Error ("You can't use RQL tags inside SQL Tags"));
  });

  test ("transform query result", () => {
    const rows = [
      { id: 1, first_name: "John", last_name: "Doe" },
      { id: 2, first_name: "Jane", last_name: "Doe" }
    ];

    expect (SQLTag.transform (refQLConfig, rows)).toEqual ([
      { id: 1, firstName: "John", lastName: "Doe" },
      { id: 2, firstName: "Jane", lastName: "Doe" }
    ]);

    expect (SQLTag.transform ({ ...refQLConfig, caseTypeJS: undefined }, rows)).toEqual ([
      { id: 1, first_name: "John", last_name: "Doe" },
      { id: 2, first_name: "Jane", last_name: "Doe" }
    ]);
  });

  test ("include variable", () => {
    const getPlayer = sql`
      select id, last_name
      from player
      where id =
    `.include (1);

    const [query, values] = getPlayer.interpret ();

    expect (query).toBe ("select id, last_name from player where id = $1");
    expect (values).toEqual ([1]);
  });

  test ("invalid include", () => {
    const getPlayer = sql`
      select id, last_name
      from player
    `;

    const getTeam = rql`
      team {
        id
        name
      } 
    `;

    const getGoalCount = sql`
      select count(*) from "goal"
      where "goal".player_id = id
    `;

    expect (() => getPlayer.include (belongsTo (getTeam)))
      .toThrowError (new Error ("You can't use a Rel inside SQL Tags"));

    expect (() => getPlayer.include (subselect ("goalCount", getGoalCount)))
      .toThrowError (new Error ("You can't use a Subselect inside SQL Tags"));
  });
});