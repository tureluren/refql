import Prop from "../RQLTag/Prop";
import { SQLTag } from "../SQLTag";

const numberProp = <As extends string, Params> (as: As, col?: string | SQLTag<Params>) =>
  Prop<As, number, Params> (as, col);

export default numberProp;