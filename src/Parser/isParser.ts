import Parser from ".";

const isParser = (value: any): value is Parser =>
  value instanceof Parser;

export default isParser;