import { StringMap } from "../common/types";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";


interface TableNode<Params> extends ASTNode<Params> {
  table: Table;
  members: ASTNode<Params>[];
}

export const tableNodePrototype = Object.assign ({}, astNodePrototype, {
  caseOf
});

function caseOf(this: TableNode<unknown>, structureMap: StringMap) {
  return structureMap[this.constructor.name] (
    this.table,
    this.members,
    this.info
  );
}

export default TableNode;