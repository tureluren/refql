import Field from "./Field";

const booleanField = <As extends string>(as: As, col?: string) =>
  Field<As, boolean> (as, col);

export default booleanField;