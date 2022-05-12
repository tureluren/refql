import setRefPath from "./setRefPath";

describe ("refs `setRefPath` sets a ref following a given path", () => {
  test ("ref updated", () => {
    expect (
      setRefPath ("game", "team", [["homeTeam", "id"]], {
        player: { position: [["positionId", "id"]] },
        game: { league: [["leagueId", "id"]] }
      })
    ).toEqual ({
      player: { position: [["positionId", "id"]] },
      game: { league: [["leagueId", "id"]], team: [["homeTeam", "id"]] }
    });

    expect (
      setRefPath ("game", "team", [["homeTeam", "id"]], {})
    ).toEqual ({ game: { team: [["homeTeam", "id"]] } });

    expect (
      setRefPath ("game", "team", [["homeTeam", "id"]], { game: {} })
    ).toEqual ({ game: { team: [["homeTeam", "id"]] } });

    expect (
      setRefPath ("game", "team", [["homeTeam", "id"]], { game: { team: [["awayTeam", "id"]] } })
    ).toEqual ({ game: { team: [["homeTeam", "id"]] } });
  });

});