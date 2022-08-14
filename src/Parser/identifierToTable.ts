import Table from "../Table";
import { Identifier } from "./Node";

const identifierToTable = (schema: string | undefined, identifier: Identifier) =>
  new Table (identifier.name, identifier.as, schema);

export default identifierToTable;