import isString from "./isString";

describe ("predicate `isString` - checks whether a given value is a String", () => {
  test ("is a String", () => {
    expect (isString ('player')).toBe (true); // eslint-disable-line quotes
    expect (isString ("team")).toBe (true);
    expect (isString (`game`)).toBe (true); // eslint-disable-line quotes
  });

  test ("not a String", () => {
    expect (isString (1)).toBe (false);
    expect (isString (true)).toBe (false);
    expect (isString ([1, 2, 3])).toBe (false);
    expect (isString ({ player: "team" })).toBe (false);
    expect (isString (() => null)).toBe (false);
    expect (isString (null)).toBe (false);
  });
});