import Field from "./Field";

const varchar = <Name extends string> (name: Name) => <As extends string>(as: As) =>
  Field<Name, As, string> (name, as);

export default varchar;