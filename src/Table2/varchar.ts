import Field from "./Field";

const varchar = (col: string) => <As>(as: As) =>
  Field<As, string> (col, as);

export default varchar;