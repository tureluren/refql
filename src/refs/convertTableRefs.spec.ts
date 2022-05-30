import convertTableRefs from "./convertTableRefs";

describe ("refs `convertTableRefs` - converts TableRefs to specified type case", () => {
  test ("TableRefs converted", () => {
    expect (
     convertTableRefs ("snake", {
       team: [["teamId", "id"]],
       position: [["positionId", "id"]]
     })
    ).toEqual ({
      team: [["team_id", "id"]],
      position: [["position_id", "id"]]
    });
  });
});