import convertRefs from "./convertRefs";

describe ("refs `convertRefs` - converts Refs with table links to specified type case", () => {
  test ("links converted", () => {
    expect (
      convertRefs ("snake", {
        player: {
          team: [["teamId", "id"]],
          position: [["positionId", "id"]]
        }
      })
    ).toEqual ({
      player: {
        team: [["team_id", "id"]],
        position: [["position_id", "id"]]
      }
    });
  });
});