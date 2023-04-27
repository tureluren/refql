import { SQLTag } from "../SQLTag";
import Prop from "./Prop";

const stringProp = <As extends string, Params> (as: As, col?: string | SQLTag<Params>) =>
  Prop<As, string, Params> (as, col);

export default stringProp;