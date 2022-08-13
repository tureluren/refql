const isFunction = (value: any): value is Function =>
  typeof value === "function";

export default isFunction;