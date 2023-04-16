import Field from "./Field";

const booleanField = <Name extends string, As extends string>(name: Name, as: As) =>
  Field<Name, As, boolean> (name, as);

export default booleanField;