import Field from "./Field";

const numberField = <Name extends string>(name: Name) => <As extends string>(as: As) =>
  Field<Name, As, number> (name, as);

export default numberField;