import Values from ".";

describe ("Values type", () => {
  test ("create Values", () => {
    const values = Values ([1, 2, 3]);

    expect (values.run ({})).toEqual ([1, 2, 3]);
    expect (Values.isValues (values)).toBe (true);
    expect (Values.isValues ({})).toBe (false);
  });
});