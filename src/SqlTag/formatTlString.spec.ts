import formatTlString from "./formatTlString";

describe ("SqlTag `formatTlString` - formats a template literal string", () => {
  test ("TLS formatted", () => {
    // remove linebreaks
    expect (formatTlString (`
      where id = 1
    `)).toBe ("where id = 1");

    // replace multispaces with a single space
    expect (formatTlString ("where id   = 1")).toBe ("where id = 1");

    // trim
    expect (formatTlString (" where id = 1 ")).toBe ("where id = 1");

    // combination
    expect (formatTlString (`
      where id   = 1 `)
    ).toBe ("where id = 1");
  });
});