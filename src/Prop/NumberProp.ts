import Prop from ".";
import { SQLTag } from "../SQLTag";

function NumberProp <As extends string, Params>(as: As, col?: string | SQLTag<Params>): Prop<As, number, Params> {
  return Prop (as, col);
}

export default NumberProp;