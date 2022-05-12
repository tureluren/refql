const isBoolean = value =>
  ({}.toString.call (value) === "[object Boolean]");

export default isBoolean;