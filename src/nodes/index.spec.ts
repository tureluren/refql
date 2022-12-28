import { dummy, dummyRefInfo } from "../test/tables";
import All from "./All";
import { isASTNode } from "./ASTNode";
import BelongsTo from "./BelongsTo";
import BelongsToMany from "./BelongsToMany";
import Call from "./Call";
import HasMany from "./HasMany";
import HasOne from "./HasOne";
import Identifier from "./Identifier";
import Literal from "./Literal";
import Raw from "./Raw";
import Ref from "./Ref";
import { isRefNode } from "./RefNode";
import StringLiteral from "./StringLiteral";
import Value from "./Value";
import Values from "./Values";
import Values2D from "./Values2D";

describe ("Nodes", () => {
  test ("is All", () => {
    expect (All.isAll (All ("*"))).toBe (true);
    expect (All.isAll ("All")).toBe (false);
  });

  test ("is ASTNode", () => {
    expect (isASTNode (All ("*"))).toBe (true);
    expect (isASTNode ("All")).toBe (false);
  });

  test ("is BelongsTo", () => {
    expect (BelongsTo.isBelongsTo (BelongsTo (dummyRefInfo, dummy``))).toBe (true);
    expect (BelongsTo.isBelongsTo ("BelongsTo")).toBe (false);
  });

  test ("is BelongsToMany", () => {
    expect (BelongsToMany.isBelongsToMany (BelongsToMany (dummyRefInfo, dummy``))).toBe (true);
    expect (BelongsToMany.isBelongsToMany ("BelongsToMany")).toBe (false);
  });

  test ("is Call", () => {
    expect (Call.isCall (Call ("concat", []))).toBe (true);
    expect (Call.isCall ("Call")).toBe (false);
  });

  test ("is HasMany", () => {
    expect (HasMany.isHasMany (HasMany (dummyRefInfo, dummy``))).toBe (true);
    expect (HasMany.isHasMany ("HasMany")).toBe (false);
  });

  test ("is HasOne", () => {
    expect (HasOne.isHasOne (HasOne (dummyRefInfo, dummy``))).toBe (true);
    expect (HasOne.isHasOne ("All")).toBe (false);
  });

  test ("is Identifier", () => {
    expect (Identifier.isIdentifier (Identifier ("id"))).toBe (true);
    expect (Identifier.isIdentifier ("Identifier")).toBe (false);
  });

  test ("is Literal", () => {
    expect (Literal.isLiteral (Literal (true))).toBe (true);
    expect (Literal.isLiteral (Literal (null))).toBe (true);
    expect (Literal.isLiteral (Literal (1))).toBe (true);
    expect (Literal.isLiteral (Literal ("one"))).toBe (true);
    expect (Literal.isLiteral ("Literal")).toBe (false);
  });

  test ("is StringLiteral", () => {
    expect (StringLiteral.isStringLiteral (StringLiteral ("select"))).toBe (true);
    expect (StringLiteral.isStringLiteral ("select")).toBe (false);
  });

  test ("is Raw", () => {
    expect (Raw.isRaw (Raw ("id"))).toBe (true);
    expect (Raw.isRaw ("Raw")).toBe (false);
  });

  test ("is Ref", () => {
    expect (Ref.isRef (Ref ("player.id", "id"))).toBe (true);
    expect (Ref.isRef ("Ref")).toBe (false);
  });

  test ("is RefNode", () => {
    expect (isRefNode (BelongsTo (dummyRefInfo, dummy`*`))).toBe (true);
    expect (isRefNode (BelongsToMany (dummyRefInfo, dummy`*`))).toBe (true);
    expect (isRefNode (HasMany (dummyRefInfo, dummy`*`))).toBe (true);
    expect (isRefNode (HasOne (dummyRefInfo, dummy`*`))).toBe (true);
    expect (isRefNode ("RefNode")).toBe (false);
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
});