import makeLinks from "./makeLinks";

describe ("refs `makeLinks` - zips two arrays to links", () => {
  test ("links create", () => {
    expect (makeLinks (["player_id"], ["id"]))
      .toEqual ([["player_id", "id"]]);

    expect (makeLinks (["player_id", "player_id_2"], ["id", "id_2"]))
      .toEqual ([["player_id", "id"], ["player_id_2", "id_2"]]);

    expect (makeLinks (["player_id", "player_id_2"], ["id"]))
      .toEqual ([["player_id", "id"], ["player_id_2", undefined]]);

    expect (makeLinks (["player_id"], ["id", "id_2"]))
      .toEqual ([["player_id", "id"]]);
  });
});