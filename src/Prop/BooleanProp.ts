import Prop from ".";
import { SQLTag } from "../SQLTag";

function BooleanProp <As extends string, Params>(as: As, col?: string | SQLTag<Params>): Prop<As, boolean, Params, false, false> {
  return Prop (as, col);
}

export default BooleanProp;