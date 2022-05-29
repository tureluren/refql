import isBoolean from "./isBoolean";

describe ("predicate `isBoolean` - checks whether a given value is a Boolean", () => {
  test ("is a Boolean", () => {
    expect (isBoolean (true)).toBe (true);
    expect (isBoolean (false)).toBe (true);
  });

  test ("not a Boolean", () => {
    expect (isBoolean ("player")).toBe (false);
    expect (isBoolean (1)).toBe (false);
    expect (isBoolean ([1, 2, 3])).toBe (false);
    expect (isBoolean ({ player: "team" })).toBe (false);
    expect (isBoolean (() => null)).toBe (false);
    expect (isBoolean (null)).toBe (false);
    expect (isBoolean (undefined)).toBe (false);
  });
});