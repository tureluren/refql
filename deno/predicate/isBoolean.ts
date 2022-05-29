const isBoolean = (value: any): value is boolean =>
  ({}.toString.call (value) === "[object Boolean]");

export default isBoolean;