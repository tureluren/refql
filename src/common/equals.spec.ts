import equals from "./equals";

describe ("equals", () => {
  test ("a equals b", () => {
    expect (equals (1, 1)).toBe (true);
    expect (equals (1, 2)).toBe (false);
    expect (equals ("a", "a")).toBe (true);
    expect (equals ("a", "b")).toBe (false);
    expect (equals ([1, 2, 3], [1, 2, 3])).toBe (true);
    expect (equals ([1, 2, 3], [4, 5, 6])).toBe (false);
    expect (equals ({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe (true);
    expect (equals ({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe (false);
    expect (equals (new Date (2020, 0, 1), new Date (2020, 0, 1))).toBe (true);
    expect (equals (new Date (2020, 0, 1), new Date (2020, 0, 2))).toBe (false);
    expect (equals (null, null)).toBe (true);
    expect (equals (null, undefined)).toBe (false);
    expect (equals (undefined, undefined)).toBe (true);
    expect (equals (true, true)).toBe (true);
    expect (equals (true, false)).toBe (false);
    expect (equals (false, false)).toBe (true);
    expect (equals (Symbol ("test"), Symbol ("test"))).toBe (false);
    expect (equals (Symbol.for ("test"), Symbol.for ("test"))).toBe (true);
  });
});