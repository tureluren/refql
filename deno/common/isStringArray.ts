const isStringArray = (value: any): value is string[] =>
  Array.isArray (value) && value.every (item => typeof item === "string");

export default isStringArray;