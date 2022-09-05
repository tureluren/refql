import Table from "../Table/index.ts";
import { Identifier } from "./nodes.ts";

const identifierToTable = <Params> (schema: string | undefined, identifier: Identifier<Params>) =>
  Table.of (identifier.name, identifier.as, schema);

export default identifierToTable;