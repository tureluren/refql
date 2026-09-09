import Prop from "./index.ts";
import { isSQLTag, SQLTag } from "../SQLTag/index.ts";
import SQLProp from "./SQLProp.ts";

function NumberProp <As extends string, Params>(as: As, col: SQLTag<Params>): SQLProp<As, number, Params, false, false>;
function NumberProp <As extends string>(as: As, col?: string): Prop<any, As, number, {}, false, false, false>;
function NumberProp <As extends string>(as: As, col?: unknown): unknown {
  if (isSQLTag (col)) {
    return SQLProp (as, col);
  }
  return Prop (as, col as string | undefined);
}

export default NumberProp;