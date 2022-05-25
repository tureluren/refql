const isLiteral = (value: any) =>
  value === "NUMBER"
    || value === "STRING"
    || value === "true"
    || value === "false"
    || value === "null";

export default isLiteral;