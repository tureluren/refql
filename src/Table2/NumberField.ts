import Field from "./Field";

const numberField = (col: string) => <As>(as: As) =>
  Field<As, number> (col, as);

export default numberField;