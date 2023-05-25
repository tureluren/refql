import When from "../common/When";
import Prop from "../Prop";
import RefProp from "../Prop/RefProp";
import sql from "../SQLTag/sql";
import { Player, Team } from "../test/tables";
import Eq from "./Eq";
import In from "./In";
import Limit from "./Limit";
import Offset from "./Offset";
import OrderBy from "./OrderBy";
import RefField from "./RefField";
import RefNode from "./RefNode";
import { isRQLNode } from "./RQLNode";

describe ("RQLNodes", () => {
  test ("is RQLNode", () => {
    expect (isRQLNode (When (() => true, [sql``]))).toBe (true);
    expect (isRQLNode ("When")).toBe (false);
  });

  test ("is When", () => {
    expect (When.isWhen (When (() => true, [sql``]))).toBe (true);
    expect (When.isWhen ("When")).toBe (false);
  });

  test ("is Eq", () => {
    expect (Eq.isEq (Eq ("id", 1))).toBe (true);
    expect (Eq.isEq ("Eq")).toBe (false);
  });

  test ("is In", () => {
    expect (In.isIn (In ("id", [1, 2, 3, 4]))).toBe (true);
    expect (In.isIn ("In")).toBe (false);
  });

  test ("order By", () => {
    expect (OrderBy.isOrderBy (OrderBy ("id", true))).toBe (true);
    expect (In.isIn ("order by")).toBe (false);
  });

  test ("is Prop", () => {
    expect (Prop.isProp (Prop ("id"))).toBe (true);
    expect (Prop.isProp ("prop")).toBe (false);
  });

  test ("is RefNode", () => {
    expect (RefNode.isRefNode (RefNode (
      Team (["*"]),
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
    expect (Limit.isLimit (Limit ())).toBe (true);
    expect (Limit.isLimit ("limit")).toBe (false);
  });

  test ("is Offset", () => {
    expect (Offset.isOffset (Offset ())).toBe (true);
    expect (Offset.isOffset ("offset")).toBe (false);
  });
});