import Ref from ".";

describe ("Ref type", () => {
  test ("is Ref", () => {
    expect (Ref.isRef (Ref ("player.id", "id"))).toBe (true);
    expect (Ref.isRef ("Ref")).toBe (false);
  });
});