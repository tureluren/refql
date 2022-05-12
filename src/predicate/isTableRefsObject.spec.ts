import isTableRefsObject from "./isTableRefsObject";

describe ("predicate `isTableRefsObject` - checks whether a given value is an Object with links to other tables", () => {
  test ("is an TableRefObject", () => {
    expect (
      isTableRefsObject ({
        team: [["teamId", "id"]]
      })
    ).toBe (true);

    expect (
      isTableRefsObject ({
        team: [["teamId", "id"]],
        game: [["gameId", "id"]]
      })
    ).toBe (true);
  });

  test ("not an TableRefObject", () => {
    expect (isTableRefsObject ({ player: "team" })).toBe (false);
    expect (isTableRefsObject (["team_id", "id"])).toBe (false);
    expect (isTableRefsObject ([["team_id", "id"]])).toBe (false);

    expect (
      isTableRefsObject ({
        player: {
          team: [["teamId", "id"]],
          game: [["gameId", "id"]]
        }
      })
    ).toBe (false);

    expect (
      isTableRefsObject ({
        team: [["teamId"]],
        game: [["gameId", "id"]]
      })
    ).toBe (false);
  });
});