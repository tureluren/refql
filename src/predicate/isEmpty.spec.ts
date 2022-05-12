import isEmpty from "./isEmpty";

describe ("more `predicate` - checks whether a given value is empty", () => {
  test ("is empty", () => {
    expect (isEmpty ([])).toBe (true);
    expect (isEmpty ({})).toBe (true);
    expect (isEmpty ("")).toBe (true);
  });

  test ("is not empty", () => {
    expect (isEmpty ([1, 2, 3])).toBe (false);
    expect (isEmpty ({ player: "team" })).toBe (false);
    expect (isEmpty ("player")).toBe (false);
  });
});