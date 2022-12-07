import Raw from ".";

describe ("Raw type", () => {
  test ("create Raw", () => {
    const raw = Raw ("select id");

    expect (raw.run ({})).toBe ("select id");
    expect (Raw.isRaw (raw)).toBe (true);
    expect (Raw.isRaw ({})).toBe (false);
  });
});