import NumberProp from "../Prop/NumberProp";
import Eq from "./Eq";
import In from "./In";
import IsNull from "./IsNull";
import Like from "./Like";
import Logic from "./Logic";
import { isOperation } from "./Operation";
import Ord from "./Ord";
import OrderBy from "./OrderBy";

describe ("Operation", () => {
  test ("is Operation", () => {
    expect (isOperation (Eq (1))).toBe (true);
    expect (isOperation ("Eq")).toBe (false);
  });

  test ("is Eq", () => {
    expect (Eq.isEq (Eq (1))).toBe (true);
    expect (Eq.isEq ("Eq")).toBe (false);
  });

  test ("is Logic", () => {
    expect (Logic.isLogic (Logic (NumberProp ("nr").gt (1), "or"))).toBe (true);
    expect (Logic.isLogic ("Logic")).toBe (false);
  });

  test ("is Like", () => {
    expect (Like.isLike (Like ("%Doe%"))).toBe (true);
    expect (Like.isLike ("Doe")).toBe (false);
  });

  test ("is Null", () => {
    expect (IsNull.isNull (IsNull ())).toBe (true);
    expect (IsNull.isNull ("IsNull")).toBe (false);
  });

  test ("is Ord", () => {
    expect (Ord.isOrd (Ord (1, ">"))).toBe (true);
    expect (Ord.isOrd ("Ord")).toBe (false);
  });

  test ("is In", () => {
    expect (In.isIn (In ([1, 2, 3, 4]))).toBe (true);
    expect (In.isIn ("In")).toBe (false);
  });

  test ("order By", () => {
    expect (OrderBy.isOrderBy (OrderBy (true))).toBe (true);
    expect (In.isIn ("order by")).toBe (false);
  });
});