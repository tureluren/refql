import { SQLTag2 } from "../SQLTag2";
import Prop from "./Prop";

const booleanProp = <As extends string, Params> (as: As, col?: string | SQLTag2<Params>) =>
  Prop<As, number, Params> (as, col);

export default booleanProp;