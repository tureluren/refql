import isNumber from "./isNumber";

describe ("predicate `isNumber` - checks whether a given value is a Number", () => {
  test ("is a Number", () => {
    expect (isNumber (1)).toBe (true);
  });

  test ("not a Number", () => {
    expect (isNumber ("team")).toBe (false);
    expect (isNumber (true)).toBe (false);
    expect (isNumber ([1, 2, 3])).toBe (false);
    expect (isNumber ({ player: "team" })).toBe (false);
    expect (isNumber (() => null)).toBe (false);
    expect (isNumber (null)).toBe (false);
  });
});