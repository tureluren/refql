import Prop from "../Prop";
import RefProp from "../Prop/RefProp";
import { TableX } from "../Table";
import Limit from "./Limit";
import Offset from "./Offset";
import RefField from "./RefField";
import RefNode from "./RefNode";
import { isRQLNode } from "./RQLNode";

describe ("RQLNodes", () => {
  test ("is RQLNode", () => {
    expect (isRQLNode (Prop ("id"))).toBe (true);
    expect (isRQLNode ("prop")).toBe (false);
  });

  test ("is Prop", () => {
    expect (Prop.isProp (Prop ("id"))).toBe (true);
    expect (Prop.isProp ("prop")).toBe (false);
  });

  test ("is RefNode", () => {
    const Player = TableX ("player", []);
    const Team = TableX ("public.team", []);
    expect (RefNode.isRefNode (RefNode (
      Team ([]),
      RefProp ("team", "public.team", "BelongsTo", { lRef: "team_id", rRef: "id" }, false),
      Player
    ))).toBe (true);

    expect (RefNode.isRefNode ("RefNode")).toBe (false);
  });

  test ("is RefField", () => {
    expect (RefField.isRefField (RefField ("player.id", "id"))).toBe (true);
    expect (RefField.isRefField ("Ref")).toBe (false);
  });

  test ("is Limit", () => {
    expect (Limit.isLimit (Limit (3))).toBe (true);
    expect (Limit.isLimit ("limit")).toBe (false);
  });

  test ("is Offset", () => {
    expect (Offset.isOffset (Offset (3))).toBe (true);
    expect (Offset.isOffset ("offset")).toBe (false);
  });
});