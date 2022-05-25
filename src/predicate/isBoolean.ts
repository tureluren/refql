const isBoolean = (value: any) =>
  ({}.toString.call (value) === "[object Boolean]");

export default isBoolean;