import toCamel from "./toCamel";

describe ("more `toCamel` - converts a String to camel case", () => {
  test ("converted to camel case", () => {
    expect (toCamel ("player")).toBe ("player");
    expect (toCamel ("game_player")).toBe ("gamePlayer");
    expect (toCamel ("gamePlayer")).toBe ("gamePlayer");
    expect (toCamel ("game_team_player")).toBe ("gameTeamPlayer");
    expect (toCamel ("gameTeam_player")).toBe ("gameTeamPlayer");
    expect (toCamel ("GameTeam_player")).toBe ("gameTeamPlayer");
  });
});