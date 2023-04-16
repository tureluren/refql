import Field from "./Field";

const stringField = <Name extends string> (name: Name) => {
  return Field<Name, "", string> (name, "");
};

export default stringField;