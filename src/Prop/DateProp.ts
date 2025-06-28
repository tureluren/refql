import Prop from ".";
import { isSQLTag, SQLTag } from "../SQLTag";
import SQLProp from "./SQLProp";

function DateProp <As extends string, Params>(as: As, col: SQLTag<Params>): SQLProp<As, Date, Params, false, false>;
function DateProp <As extends string>(as: As, col?: string): Prop<any, As, Date, {}, false, false, false>;
function DateProp <As extends string>(as: As, col?: unknown): unknown {
  if (isSQLTag (col)) {
    return SQLProp (as, col);
  }
  return Prop (as, col as string | undefined);
}

export default DateProp;