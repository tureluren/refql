import sql from "../SQLTag/sql";
import Table from "../Table";
import rql from "../RQLTag/rql";
import varToSQLTag from "./varToSQLTag";

describe ("JBOInterpreter `varToSQLTag` - tranforms a variable into a SQLTag", () => {
  test ("variable is SQLTag", () => {
    const table = Table ("player", "player");

    const tag = sql`
      select *
      from "player"
      where "player".id = 1
    `;

    expect (varToSQLTag (tag, table)).toEqual (tag);
  });

  test ("variable is function that returns a SQLTag", () => {
    const table = Table ("player", "player");

    const tag = t => sql`
      select *
      from ${t}
      where ${t}.id = 1
    `;

    const expected = sql`
      select *
      from ${table}
      where ${table}.id = 1
    `;

    expect (varToSQLTag (tag, table)).toEqual (expected);
  });

  test ("variable can't be transformed into SQLTag", () => {
    const table = Table ("player", "player");

    expect (varToSQLTag ("player", table)).toBe (null);

    expect (() => varToSQLTag (rql`player { id lastName }`, table))
      .toThrowError (new Error ("You can't nest RQL tags"));

    expect (() => varToSQLTag (_t => rql`player { id lastName }`, table))
      .toThrowError (new Error ("Only functions that return a sql snippet are allowed"));

    expect (() => varToSQLTag (_t => "player { id lastName }", table))
      .toThrowError (new Error ("Only functions that return a sql snippet are allowed"));
  });
});