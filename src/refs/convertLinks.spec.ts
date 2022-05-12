import convertLinks from "./convertLinks";

describe ("refs `convertLinks` - converts table links to specified type case", () => {
  test ("links converted", () => {
    expect (
      convertLinks ("snake", [["teamId", "id"]])
    ).toEqual ([["team_id", "id"]]);

    expect (
      convertLinks ("camel", [["team_id", "id"]])
    ).toEqual ([["teamId", "id"]]);

    expect (
      convertLinks ("snake", [["teamId", "id"], ["teamId2", "id2"]])
    ).toEqual ([["team_id", "id"], ["team_id2", "id2"]]);

    expect (
      convertLinks ("camel", [["team_id", "id"], ["team_id2", "id2"]])
    ).toEqual ([["teamId", "id"], ["teamId2", "id2"]]);
  });
});