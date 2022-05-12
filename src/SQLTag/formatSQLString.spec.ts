import formatSQLString from "./formatSQLString";

describe ("SQLTag `formatSQLString` - formats a SQL string", () => {
  test ("SQL formatted", () => {
    // replace multispaces with a single space
    expect (formatSQLString ("where id   = 1")).toBe ("where id = 1");

    // cast after variable
    expect (formatSQLString ("where id = $ ::text")).toBe ("where id = $::text");

    // table + member as variable
    expect (formatSQLString ("where id = player. $")).toBe ("where id = player.$");

    // replace single space + dot with a dot
    expect (formatSQLString (" where player .id = 1 ")).toBe ("where player.id = 1");

    // trim
    expect (formatSQLString (" where id = 1 ")).toBe ("where id = 1");
  });
});