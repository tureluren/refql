import SQLTag2 from "../SQLTag2";
import Field from "./Field";

const varchar = <As extends string, Params> (as: As, col?: string | SQLTag2<Params>) =>
  Field<As, string, Params> (as, col);

export default varchar;