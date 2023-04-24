import SQLTag2 from "../SQLTag2";
import Field from "./Field";

const booleanProp = <As extends string, Params> (as: As, col?: string | SQLTag2<Params>) =>
  Field<As, number, Params> (as, col);

export default booleanProp;