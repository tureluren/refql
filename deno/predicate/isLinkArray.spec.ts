import isLinkArray from "./isLinkArray";

describe ("predicate `isLinkArray` - checks whether a given value is an Array with table links", () => {
  test ("is an LinkArray", () => {
    expect (isLinkArray ([["team_id", "id"]])).toBe (true);
    expect (isLinkArray ([["team_id", "id"], ["team_id_2", "id_2"]])).toBe (true);
  });

  test ("not an LinkArray", () => {
    expect (isLinkArray ({ player: "team" })).toBe (false);
    expect (isLinkArray ([["team_id"]])).toBe (false);
    expect (isLinkArray ([["team_id", "id", "player_id"]])).toBe (false);
    expect (isLinkArray ([["team_id", true]])).toBe (false);
  });
});