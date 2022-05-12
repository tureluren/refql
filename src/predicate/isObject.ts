const isObject = value =>
  toString.call (value) === "[object Object]";

export default isObject;