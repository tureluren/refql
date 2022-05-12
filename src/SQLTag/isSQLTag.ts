import SQLTag from ".";
import getType from "../more/getType";

const isSQLTag = (value): value is SQLTag =>
  getType (value) === "SQLTag";

export default isSQLTag;