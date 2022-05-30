import areRefs from "./areRefs";

describe ("predicate `areRefs` - checks whether a given value is an Object valid Refs", () => {
  test ("are Refs", () => {
    expect (
      areRefs ({
        player: {
          team: [["teamId", "id"]],
          game: [["gameId", "id"]]
        }
      })
    ).toBe (true);
  });

  test ("are not Refs", () => {
    expect (areRefs ({ player: "team" })).toBe (false);
    expect (areRefs (["team_id", "id"])).toBe (false);
    expect (areRefs ([["team_id", "id"]])).toBe (false);

    expect (
      areRefs ({
        team: [["teamId"]],
        game: [["gameId", "id"]]
      })
    ).toBe (false);
  });
});