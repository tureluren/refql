import Prop from ".";
import { isSQLTag, SQLTag } from "../SQLTag";
import SQLProp from "./SQLProp";

function stringProp <As extends string, Params>(as: As, col: SQLTag<Params>): SQLProp<As, Params, string>;
function stringProp <As extends string>(as: As, col?: string): Prop<As, string>;
function stringProp <As extends string>(as: As, col?: unknown): unknown {
  if (isSQLTag (col)) {
    return SQLProp (as, col);
  }
  return Prop (as, col as string | undefined);
}

export default stringProp;