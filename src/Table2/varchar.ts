import Field from "./Field";

const varchar = <As extends string> (as: As, col?: string) =>
  Field<As, string> (as, col);

export default varchar;