import { RefInput } from "../common/types";
import validateRefInput from "./validateRefInput";

describe ("validateRefInput", () => {
  test ("valid input object with lRef", () => {
    const input: RefInput = {
      lRef: ["id"]
    };

    expect (() => validateRefInput (input)).not.toThrow ();
  });

  test ("valid input with all fields", () => {
    const input: RefInput = {
      lRef: ["id"],
      rRef: ["user_id"],
      xTable: "user_project",
      lxRef: ["user_id"],
      rxRef: ["project_id"]
    };

    expect (() => validateRefInput (input)).not.toThrow ();
  });

  test ("input is not an object", () => {
    const input = "{}" as unknown as RefInput;

    expect (() => validateRefInput (input)).toThrow ("Invalid input: input is not an object");
  });

  test ("lRef is not an array of strings", () => {
    const input = {
      lRef: "id" // should be ["id"]
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: lRef must be an array of strings");
  });

  test ("rRef is not an array of strings", () => {
    const input = {
      lRef: ["id"],
      rRef: 123 // should be ["id"]
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: rRef must be an array of strings");
  });

  test ("xTable is not a string", () => {
    const input = {
      lRef: ["id"],
      rRef: ["id"],
      xTable: {} // invalid
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: xTable must be a string");
  });

  test ("lxRef is not an array of strings", () => {
    const input = {
      lRef: ["id"],
      rRef: ["id"],
      xTable: "game_player",
      lxRef: false // invalid
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: lxRef must be an array of strings");
  });

  test ("rxRef is not an array of strings", () => {
    const input = {
      lRef: ["id"],
      rRef: ["id"],
      xTable: "game_player",
      lxRef: ["player_id"],
      rxRef: null // invalid
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: rxRef must be an array of strings");
  });

  test ("lRef and rRef have different lengths", () => {
    const input = {
      lRef: ["id"],
      rRef: ["user_id", "extra"]
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: lRef and rRef must have the same number of elements");
  });

  test ("lxRef and rxRef have different lengths", () => {
    const input = {
      lRef: ["id"],
      rRef: ["id"],
      xTable: "game_player",
      lxRef: ["player_id", "alt_id"],
      rxRef: ["game_id"]
    };

    expect (() => validateRefInput (input as any)).toThrow ("Invalid input: lxRef and rxRef must have the same number of elements");
  });
});
