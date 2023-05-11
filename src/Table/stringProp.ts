import Prop from "../RQLTag/Prop";
import { SQLTag } from "../SQLTag";

const stringProp = <As extends string, Params> (as: As, col?: string | SQLTag<Params>) =>
  Prop<As, string, Params> (as, col);

export default stringProp;