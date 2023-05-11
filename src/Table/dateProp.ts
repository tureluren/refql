import Prop from "../RQLTag/Prop";
import { SQLTag } from "../SQLTag";

const dateProp = <As extends string, Params> (as: As, col?: string | SQLTag<Params>) =>
  Prop<As, Date, Params> (as, col);

export default dateProp;