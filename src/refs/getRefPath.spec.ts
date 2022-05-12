import getRefPath from "./getRefPath";

describe ("refs `getRefPath` gets a ref following a given path", () => {
  test ("got ref", () => {
    expect (
      getRefPath ("game", "team", { game: { team: [["homeTeam", "id"]] } })
    ).toEqual ([["homeTeam", "id"]]);

    expect (
      getRefPath ("game", "team", {})
    ).toEqual (undefined);
  });

});