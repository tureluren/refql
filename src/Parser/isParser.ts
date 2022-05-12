import getType from "../more/getType";

const isParser = (value): value is Parser =>
  getType (value) === "Parser";

export default isParser;