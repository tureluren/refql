import isFunction from "./isFunction";

describe ("predicate `isFunction` - checks whether a given value is a Function", () => {
  test ("is a Function", () => {
    expect (isFunction (() => null)).toBe (true);
  });

  test ("not a Function", () => {
    expect (isFunction (1)).toBe (false);
    expect (isFunction ("player")).toBe (false);
    expect (isFunction (true)).toBe (false);
    expect (isFunction ({ player: "team" })).toBe (false);
    expect (isFunction (null)).toBe (false);
    expect (isFunction ([1, 2, 3])).toBe (false);
  });
});