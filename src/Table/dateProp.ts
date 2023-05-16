import Prop from "../RQLTag/Prop";
import SQLProp from "../RQLTag/SQLProp";
import { isSQLTag, SQLTag } from "../SQLTag";

function dateProp <As extends string, Params>(as: As, col: SQLTag<Params>): SQLProp<As, Params, Date>;
function dateProp <As extends string>(as: As, col?: string): Prop<As, Date>;
function dateProp <As extends string>(as: As, col?: unknown): unknown {
  if (isSQLTag (col)) {
    return SQLProp (as, col);
  }
  return Prop (as, col as string | undefined);
}
export default dateProp;