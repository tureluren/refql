const isNumber = (value: any) =>
  typeof value === "number" && !isNaN (value);

export default isNumber;