import Field from "./Field";

const numberField = <As extends string> (as: As, col?: string) => {
  return Field<As, number> (as, col);
};

export default numberField;