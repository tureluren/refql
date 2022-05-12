import Parser from ".";

const isParser = (value): value is Parser =>
  value instanceof Parser;

export default isParser;