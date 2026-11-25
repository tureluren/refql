import Prop from "./index.ts";
import { isSQLTag, SQLTag } from "../SQLTag/index.ts";
import SQLProp from "./SQLProp.ts";

function BooleanProp <As extends string, Params>(as: As, col: SQLTag<Params>): SQLProp<As, boolean, Params, false, false>;
function BooleanProp <As extends string>(as: As, col?: string): Prop<any, As, boolean, {}, false, false, false>;
function BooleanProp <As extends string>(as: As, col?: unknown): unknown {
  if (isSQLTag (col)) {
    return SQLProp (as, col);
  }
  return Prop (as, col as string | undefined);
}

export default BooleanProp;