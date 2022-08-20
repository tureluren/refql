import Table from "../Table";
import { Identifier } from "./Node";

const identifierToTable = <Params> (schema: string | undefined, identifier: Identifier<Params>) =>
  Table.of (identifier.name, identifier.as, schema);

export default identifierToTable;