import Field from "./Field";

const arrayOf = (f: <T>(...args: any[]) => T) => (...args: any[]) => {
  const field: Field = f (...args);
  return Field<typeof field["name"], typeof field["as"], typeof field["type"][]> (field.name, field.as);
};

export default arrayOf;