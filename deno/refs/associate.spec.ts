import associate from "./associate";

describe ("refs `associate` - turns a link(s) between tables into SQL", () => {
  test ("association created", () => {
    expect (
      associate ("player", "team", [["team_id", "id"]])
    ).toBe ('"player".team_id = "team".id');

    expect (
      associate ("player", "team", [["team_id", "id"], ["team_id_2", "id_2"]])
    ).toBe ('"player".team_id = "team".id and "player".team_id_2 = "team".id_2');

    expect (
      associate ("player", "team", [["team_id", "id"], ["team_id_2", "id_2"], ["team_id_3", "id_3"]])
    ).toBe ('"player".team_id = "team".id and "player".team_id_2 = "team".id_2 and "player".team_id_3 = "team".id_3');
  });
});