import isLiteral from "./isLiteral";

describe ("predicate `isLiteral` - checks whether a given value is a Literal", () => {
  test ("is a Literal", () => {
    expect (isLiteral ("NUMBER")).toBe (true);
    expect (isLiteral ("STRING")).toBe (true);
    expect (isLiteral ("true")).toBe (true);
    expect (isLiteral ("false")).toBe (true);
    expect (isLiteral ("null")).toBe (true);
  });

  test ("not a Literal", () => {
    expect (isLiteral (1)).toBe (false);
    expect (isLiteral (true)).toBe (false);
    expect (isLiteral ([1, 2, 3])).toBe (false);
    expect (isLiteral ({ player: "team" })).toBe (false);
    expect (isLiteral (() => null)).toBe (false);
    expect (isLiteral (null)).toBe (false);
  });
});