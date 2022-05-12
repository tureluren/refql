import isObject from "./isObject";

describe ("predicate `isObject` - checks whether a given value is a Object", () => {
  test ("is a Object", () => {
    expect (isObject ({ player: "team" })).toBe (true);
  });

  test ("not a Object", () => {
    expect (isObject ("player")).toBe (false);
    expect (isObject (1)).toBe (false);
    expect (isObject (true)).toBe (false);
    expect (isObject ([1, 2, 3])).toBe (false);
    expect (isObject (() => null)).toBe (false);
    expect (isObject (null)).toBe (false);
  });
});