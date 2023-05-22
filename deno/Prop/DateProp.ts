import Prop from "./index.ts";
import { isSQLTag, SQLTag } from "../SQLTag/index.ts";
import SQLProp from "./SQLProp.ts";

function DateProp <As extends string, Params>(as: As, col: SQLTag<Params>): SQLProp<As, Params, Date>;
function DateProp <As extends string>(as: As, col?: string): Prop<As, Date>;
function DateProp <As extends string>(as: As, col?: unknown): unknown {
  if (isSQLTag (col)) {
    return SQLProp (as, col);
  }
  return Prop (as, col as string | undefined);
}

export default DateProp;