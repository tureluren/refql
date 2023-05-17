import Prop from ".";
import { isSQLTag, SQLTag } from "../SQLTag";
import SQLProp from "./SQLProp";

function numberProp <As extends string, Params>(as: As, col: SQLTag<Params>): SQLProp<As, Params, number>;
function numberProp <As extends string>(as: As, col?: string): Prop<As, number>;
function numberProp <As extends string>(as: As, col?: unknown): unknown {
  if (isSQLTag (col)) {
    return SQLProp (as, col);
  }
  return Prop (as, col as string | undefined);
}

export default numberProp;