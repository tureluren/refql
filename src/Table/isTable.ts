import Table from ".";
import getType from "../more/getType";

const isTable = (value): value is Table =>
  getType (value) === "Table";

export default isTable;