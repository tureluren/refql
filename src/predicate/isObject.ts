const isObject = (value: any) =>
  toString.call (value) === "[object Object]";

export default isObject;