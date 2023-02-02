import { RefInput } from "../common/types";
import { validateRefInput } from "./RefNode";

describe ("validateRefInput", () => {
  test ("valid input object", () => {
    const input = {
      as: "goals",
      lRef: "id"
    };

    expect (() => validateRefInput (input)).not.toThrow ();
  });

  test ("input is not an object", () => {
    const input = "{}" as RefInput;

    expect (() => validateRefInput (input)).toThrow ("Invalid input: input is not an object");
  });

  test ("as is not a string", () => {
    const input = {
      as: ["goals"],
      lRef: "id"
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: as is not a string");
  });

  test ("lRef is not a string", () => {
    const input = {
      as: "goals",
      lRef: ["id"]
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: lRef is not a string");
  });

  test ("rRef is not a string", () => {
    const input = {
      as: "goals",
      lRef: "id",
      rRef: 123
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: rRef is not a string");
  });

  test ("xTable is not a string", () => {
    const input = {
      as: "games",
      lRef: "id",
      rRef: "id",
      xTable: {}
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: xTable is not a string");
  });

  test ("lxRef is not a string", () => {
    const input = {
      as: "games",
      lRef: "id",
      rRef: "id",
      xTable: "game_player",
      lxRef: false
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: lxRef is not a string");
  });

  test ("rxRef is not a string", () => {
    const input = {
      as: "games",
      lRef: "id",
      rRef: "id",
      xTable: "game_player",
      lxRef: "player_id",
      rxRef: null
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: rxRef is not a string");
  });
});
