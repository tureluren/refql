import formatTLString from "./formatTLString";

describe ("SQLTag `formatTLString` - formats a template literal string", () => {
  test ("TLS formatted", () => {
    // remove linebreaks
    expect (formatTLString (`
      where id = 1
    `)).toBe ("where id = 1");

    // replace multispaces with a single space
    expect (formatTLString ("where id   = 1")).toBe ("where id = 1");

    // trim
    expect (formatTLString (" where id = 1 ")).toBe ("where id = 1");

    // combination
    expect (formatTLString (`
      where id   = 1 `)
    ).toBe ("where id = 1");
  });
});