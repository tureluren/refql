import Prop from ".";
import { SQLTag } from "../SQLTag";

function StringProp <As extends string, Params = {}>(as: As, col?: string | SQLTag<Params>): Prop<As, string, Params> {
  return Prop (as, col);
}

export default StringProp;