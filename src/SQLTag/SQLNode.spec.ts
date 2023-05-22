import { flMap } from "../common/consts";
import When from "../common/When";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import { isSQLNode } from "./SQLNode";
import Value from "./Value";
import Values from "./Values";
import Values2D from "./Values2D";

describe ("SQLNodes", () => {
  test ("is SQLNode", () => {
    expect (isSQLNode (Raw ("*"))).toBe (true);
    expect (isSQLNode ("*")).toBe (false);
  });

  test ("is Raw", () => {
    expect (Raw.isRaw (Raw ("id"))).toBe (true);
    expect (Raw.isRaw ("Raw")).toBe (false);
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
});