const isString = (value: any): value is string =>
  typeof value === "string";

export default isString;