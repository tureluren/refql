import Field from "./Field";

const varchar = <Name extends string, As extends string> (name: Name, as: As) =>
  Field<Name, As, string> (name, as);

export default varchar;