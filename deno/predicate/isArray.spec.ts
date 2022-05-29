import isArray from "./isArray";

describe ("predicate `isArray` - checks whether a given value is an Array", () => {
  test ("is an Array", () => {
    expect (isArray ([1, 2, 3])).toBe (true);
  });

  test ("not an Array", () => {
    expect (isArray (1)).toBe (false);
    expect (isArray ("player")).toBe (false);
    expect (isArray (true)).toBe (false);
    expect (isArray ({ player: "team" })).toBe (false);
    expect (isArray (() => null)).toBe (false);
    expect (isArray (null)).toBe (false);
  });
});