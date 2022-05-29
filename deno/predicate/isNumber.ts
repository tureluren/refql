const isNumber = (value: any): value is number =>
  typeof value === "number" && !isNaN (value);

export default isNumber;