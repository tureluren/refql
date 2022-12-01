import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Root<Params> extends ASTNode<Params> {
  table: Table;
  members: ASTNode<Params>[];
}

const type = "refql/Root";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Root,
  [refqlType]: type,
  caseOf
});

function Root<Params>(table: Table, members: ASTNode<Params>[]) {
  let root: Root<Params> = Object.create (prototype);

  root.table = table;
  root.members = members;

  return root;
}

function caseOf(this: Root<unknown>, structureMap: StringMap) {
  return structureMap.Root (
    this.table,
    this.members
  );
}

Root.isRoot = function<Params> (value: any): value is Root<Params> {
  return value != null && value[refqlType] === type;
};

export default Root;