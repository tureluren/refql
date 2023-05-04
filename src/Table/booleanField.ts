import { SQLTag } from "../SQLTag";
import Prop from "./Prop";

const booleanProp = <As extends string, Params> (as: As, col?: string | SQLTag<Params>) =>
  Prop<As, number, Params> (as, col);

export default booleanProp;