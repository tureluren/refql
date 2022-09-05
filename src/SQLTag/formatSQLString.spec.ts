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

    // replace single space + comma with a dot
    expect (formatSQLString ("concat(first_name , ' ', last_name)")).toBe ("concat(first_name, ' ', last_name)");

    // replace single space + closing parenthesis with a closing parenthesis
    expect (formatSQLString ("concat(first_name , ' ', last_name )")).toBe ("concat(first_name, ' ', last_name)");

    // replace opening parenthesis + single space with an opening parenthesis
    expect (formatSQLString ("concat( first_name , ' ', last_name)")).toBe ("concat(first_name, ' ', last_name)");

    // trim
    expect (formatSQLString (" where id = 1 ")).toBe ("where id = 1");
  });
});