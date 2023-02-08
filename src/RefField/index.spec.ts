import RefField from ".";

describe ("RefField type", () => {
  test ("is Ref", () => {
    expect (RefField.isRefField (RefField ("player.id", "id"))).toBe (true);
    expect (RefField.isRefField ("Ref")).toBe (false);
  });
});