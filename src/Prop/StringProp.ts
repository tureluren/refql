import Prop from ".";
import { isSQLTag, SQLTag } from "../SQLTag";
import SQLProp from "./SQLProp";

function StringProp <As extends string, Params>(as: As, col: SQLTag<Params>): SQLProp<As, string, Params, false, false>;
function StringProp <As extends string>(as: As, col?: string): Prop<any, As, string, {}, false, false, false>;
function StringProp <As extends string>(as: As, col?: unknown): unknown {
  if (isSQLTag (col)) {
    return SQLProp (as, col);
  }
  return Prop (as, col as string | undefined);
}

export default StringProp;