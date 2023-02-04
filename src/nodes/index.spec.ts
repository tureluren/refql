import { flMap } from "../common/consts";
import sql from "../SQLTag/sql";
import { dummy, dummyRefInfo } from "../test/tables";
import All from "./All";
import { isASTNode } from "./ASTNode";
import BelongsToMany, { belongsToMany } from "./BelongsToMany";
import Call from "./Call";
import Identifier from "./Identifier";
import Literal from "./Literal";
import Raw from "./Raw";
import RefNode, { belongsTo } from "./RefNode";
import StringLiteral from "./StringLiteral";
import Value from "./Value";
import Values from "./Values";
import Values2D from "./Values2D";
import When from "./When";

describe ("Nodes", () => {
  test ("is All", () => {
    expect (All.isAll (All ("*"))).toBe (true);
    expect (All.isAll ("All")).toBe (false);
  });

  test ("is ASTNode", () => {
    expect (isASTNode (All ("*"))).toBe (true);
    expect (isASTNode ("All")).toBe (false);
  });

  test ("is Call", () => {
    expect (Call.isCall (Call ("concat", []))).toBe (true);
    expect (Call.isCall ("Call")).toBe (false);
  });

  test ("is Identifier", () => {
    expect (Identifier.isIdentifier (Identifier ("id"))).toBe (true);
    expect (Identifier.isIdentifier ("Identifier")).toBe (false);
  });

  test ("is Literal", () => {
    expect (Literal.isLiteral (Literal (true))).toBe (true);
    expect (Literal.isLiteral (Literal (null))).toBe (true);
    expect (Literal.isLiteral (Literal (1))).toBe (true);
    expect (Literal.isLiteral (StringLiteral ("one"))).toBe (true);
    expect (Literal.isLiteral ("Literal")).toBe (false);
  });

  test ("is Raw", () => {
    expect (Raw.isRaw (Raw ("id"))).toBe (true);
    expect (Raw.isRaw ("Raw")).toBe (false);
  });

  test ("is RefNode", () => {
    expect (RefNode.isRefNode (RefNode (dummyRefInfo, dummy`*`, true))).toBe (true);
    expect (RefNode.isRefNode (BelongsToMany (dummyRefInfo, dummy`*`, true))).toBe (true);
    expect (RefNode.isRefNode ("RefNode")).toBe (false);
  });

  test ("Value", () => {
    expect (Value (1).run ({})).toBe (1);
  });

  test ("is Value", () => {
    expect (Value.isValue (Value (1))).toBe (true);
    expect (Value.isValue ("Value")).toBe (false);
  });

  test ("Values", () => {
    expect (Values ([1]).run ({})).toEqual ([1]);
  });

  test ("is Values", () => {
    expect (Values.isValues (Values ([1]))).toBe (true);
    expect (Values.isValues ("Values")).toBe (false);
  });

  test ("Values2D", () => {
    expect (Values2D ([[1]]).run ({})).toEqual ([[1]]);
  });

  test ("is Values2D", () => {
    expect (Values2D.isValues2D (Values2D ([[1]]))).toBe (true);
    expect (Values2D.isValues2D ("Values2D")).toBe (false);
  });

  test ("is When", () => {
    expect (When.isWhen (When (() => true, sql``))).toBe (true);
    expect (When.isWhen ("When")).toBe (false);
  });

  test ("Raw is functor", () => {
    const raw = Raw ("select * from player");

    const limit = (x: any) => `${x} limit 10`;
    const offset = (x: any) => `${x} offset 10`;

    const raw2 = raw[flMap] (v => v);
    expect (raw2.run ({})).toEqual (raw.run ({}));

    const raw3 = raw[flMap] (v => offset (limit (v)));
    const raw4 = raw[flMap] (limit)[flMap] (offset);

    expect (raw3.run ({})).toEqual (raw4.run ({}));
  });

  test ("Invalid RefNode creation", () => {
    expect (() => belongsTo (["goal"] as any)).toThrow ("Invalid table: goal, expected a string");
    expect (() => belongsToMany (["games"] as any)).toThrow ("Invalid table: games, expected a string");
  });
});