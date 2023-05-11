import Prop from "../RQLTag/Prop";
import { SQLTag } from "../SQLTag";

const booleanProp = <As extends string, Params> (as: As, col?: string | SQLTag<Params>) =>
  Prop<As, number, Params> (as, col);

export default booleanProp;