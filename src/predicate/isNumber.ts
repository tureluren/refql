const isNumber = value =>
  typeof value === "number" && !isNaN (value);

export default isNumber;