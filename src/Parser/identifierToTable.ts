import Table from "../Table";
import { Identifier } from "./nodes";

const identifierToTable = (schema: string | undefined, identifier: Identifier) =>
  Table (identifier.name, identifier.as, schema);

export default identifierToTable;