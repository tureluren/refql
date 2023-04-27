import { SQLTag2 } from "../SQLTag2";
import Prop from "./Prop";

const stringProp = <As extends string, Params> (as: As, col?: string | SQLTag2<Params>) =>
  Prop<As, string, Params> (as, col);

export default stringProp;