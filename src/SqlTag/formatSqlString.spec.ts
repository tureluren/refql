import formatSqlString from "./formatSqlString";

describe ("SqlTag `formatSqlString` - formats a Sql string", () => {
  test ("Sql formatted", () => {
    // replace multispaces with a single space
    expect (formatSqlString ("where id   = 1")).toBe ("where id = 1");

    // cast after variable
    expect (formatSqlString ("where id = $ ::text")).toBe ("where id = $::text");

    // table + member as variable
    expect (formatSqlString ("where id = player. $")).toBe ("where id = player.$");

    // replace single space + dot with a dot
    expect (formatSqlString (" where player .id = 1 ")).toBe ("where player.id = 1");

    // replace single space + comma with a dot
    expect (formatSqlString ("concat(first_name , ' ', last_name)")).toBe ("concat(first_name, ' ', last_name)");

    // replace single space + closing parenthesis with a closing parenthesis
    expect (formatSqlString ("concat(first_name , ' ', last_name )")).toBe ("concat(first_name, ' ', last_name)");

    // replace opening parenthesis + single space with an opening parenthesis
    expect (formatSqlString ("concat( first_name , ' ', last_name)")).toBe ("concat(first_name, ' ', last_name)");

    // trim
    expect (formatSqlString (" where id = 1 ")).toBe ("where id = 1");
  });
});