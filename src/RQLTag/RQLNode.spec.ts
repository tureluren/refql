import When from "../common/When";
import sql from "../SQLTag/sql";
import { Player } from "../test/tables";
import Eq from "./Eq";
import isRQLNode from "./isRQLNode";
import Prop from "./Prop";
import RefNode from "./RefNode";

describe ("RQLNodes", () => {
  test ("is RQLNode", () => {
    expect (isRQLNode (When (() => true, sql``))).toBe (true);
    expect (isRQLNode ("When")).toBe (false);
  });

  test ("is Eq", () => {
    expect (Eq.isEq (Eq ("id", 1))).toBe (true);
    expect (Eq.isEq ("Eq")).toBe (false);
  });

  test ("is Prop", () => {
    expect (Prop.isProp (Prop ("id"))).toBe (true);
    expect (Prop.isProp ("prop")).toBe (false);
  });

  test ("is RefNode", () => {
    expect (RefNode.isRefNode (RefNode (Player (["*"]), {} as any, Player as any))).toBe (true);
    expect (RefNode.isRefNode ("RefNode")).toBe (false);
  });

});