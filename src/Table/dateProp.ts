import { SQLTag } from "../SQLTag";
import Prop from "./Prop";

const dateProp = <As extends string, Params> (as: As, col?: string | SQLTag<Params>) =>
  Prop<As, Date, Params> (as, col);

export default dateProp;