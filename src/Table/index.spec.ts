import { TableX, isTable } from ".";
import { flEquals } from "../common/consts";
import Raw from "../SQLTag/Raw";

describe ("Table type", () => {
  test ("create Table", () => {
    const Player = TableX ("player", []);
    const Player2 = TableX ("public.player", []);
    expect (Player.name).toBe ("player");
    expect (Player.schema).toBe (undefined);
    expect (Player2.schema).toBe ("public");
    expect (`${Player}`).toBe ("player");
    expect (`${Player2}`).toBe ("public.player");
    expect (isTable (Player)).toBe (true);
    expect (isTable ({})).toBe (false);
  });

  test ("Setoid", () => {
    const Player = TableX ("player", []);
    const Team = TableX ("public.team", []);
    expect (Player[flEquals] (Player)).toBe (true);
    expect (Player[flEquals] (Raw ("player") as any)).toBe (false);
    expect (Player[flEquals] (Team as any)).toBe (Team[flEquals] (Player as any));
    expect (Player[flEquals] (Player) && Player[flEquals] (Player)).toBe (Player[flEquals] (Player));
  });

  test ("errors", () => {
    expect (() => TableX ("player", {} as any))
      .toThrowError (new Error ("Invalid props: not an Array"));

    expect (() => TableX (1 as any, []))
      .toThrowError (new Error ("Invalid table: 1, expected a string"));
  });
});