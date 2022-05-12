import getRefInfo from "./getRefInfo";

describe ("refs `getRefInfo` - turn a postgres reference constraint into an Object with info about the ref", () => {
  test ("ref info obtained", () => {
    expect (
      getRefInfo ("player", "FOREIGN KEY (team_id) REFERENCES team(id) ON DELETE CASCADE")
    ).toEqual ({
      tableFrom: "player",
      tableTo: "team",
      tableFromCols: ["team_id"],
      tableToCols: ["id"]
    });

    expect (
      getRefInfo ("player", "FOREIGN KEY (team_id, team_id_2) REFERENCES team(id, id_2)")
    ).toEqual ({
      tableFrom: "player",
      tableTo: "team",
      tableFromCols: ["team_id", "team_id_2"],
      tableToCols: ["id", "id_2"]
    });
  });
});