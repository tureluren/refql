import formatSqlString from "./formatSqlString";

describe ("SqlTag `formatSqlString` - formats a SQL string", () => {
  test ("SQL formatted", () => {
    // replace multispaces with a single space
    expect (formatSqlString ("where id   = 1")).toBe ("where id = 1");

    // cast after variable
    expect (formatSqlString ("where id = $ ::text")).toBe ("where id = $::text");

    // table + AstNode as variable
    expect (formatSqlString ("where id = player. $")).toBe ("where id = player.$");

    // replace single space + dot with a dot
    expect (formatSqlString (" where player .id = 1 ")).toBe ("where player.id = 1");

    // trim
    expect (formatSqlString (" where id = 1 ")).toBe ("where id = 1");
  });
});