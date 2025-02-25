import Prop from ".";
import { SQLTag } from "../SQLTag";

function DateProp <As extends string, Params>(as: As, col?: string | SQLTag<Params>): Prop<As, Date, Params, false, false> {
  return Prop (as, col);
}

export default DateProp;