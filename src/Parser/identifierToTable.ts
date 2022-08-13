import Table from "../Table";
import { Identifier } from "./Node";

const identifierToTable = (identifier: Identifier) =>
  new Table (identifier.name, identifier.as);

export default identifierToTable;