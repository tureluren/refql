import Prop from "../RQLTag/Prop";
import SQLProp from "../RQLTag/SQLProp";
import { isSQLTag, SQLTag } from "../SQLTag";

function booleanProp <As extends string, Params>(as: As, col: SQLTag<Params>): SQLProp<As, boolean, Params>;
function booleanProp <As extends string>(as: As, col?: string): Prop<As, boolean>;
function booleanProp <As extends string>(as: As, col?: unknown): unknown {
  if (isSQLTag (col)) {
    return SQLProp (as, col as any);
  }
  return Prop (as, col as any);
}
export default booleanProp;