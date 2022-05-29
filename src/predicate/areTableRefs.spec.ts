import areTableRefs from "./areTableRefs";

describe ("predicate `areTableRefs` - checks whether a given value is an Object with links to other tables", () => {
  test ("are TableRefs", () => {
    expect (
      areTableRefs ({
        team: [["teamId", "id"]]
      })
    ).toBe (true);

    expect (
      areTableRefs ({
        team: [["teamId", "id"]],
        game: [["gameId", "id"]]
      })
    ).toBe (true);
  });

  test ("are not TableRefs", () => {
    expect (areTableRefs ({ player: "team" })).toBe (false);
    expect (areTableRefs (["team_id", "id"])).toBe (false);
    expect (areTableRefs ([["team_id", "id"]])).toBe (false);

    expect (
      areTableRefs ({
        player: {
          team: [["teamId", "id"]],
          game: [["gameId", "id"]]
        }
      })
    ).toBe (false);

    expect (
      areTableRefs ({
        team: [["teamId"]],
        game: [["gameId", "id"]]
      })
    ).toBe (false);
  });
});