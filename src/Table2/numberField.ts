import Field from "./Field";

const numberField = <Name extends string, As extends string> (name: Name, as: As) => {
  return Field<Name, As, number> (name, as);
};

export default numberField;