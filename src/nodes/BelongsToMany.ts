import { refqlType } from "../common/consts";
import { BelongsToManyInfo, StringMap } from "../common/types";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface BelongsToMany<Params> extends ASTNode<Params> {
  table: Table;
  members: ASTNode<Params>[];
  info: BelongsToManyInfo;
}

const type = "refql/BelongsToMany";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: BelongsToMany,
  [refqlType]: type,
  caseOf
});

function BelongsToMany<Params>(table: Table, info: BelongsToManyInfo, members: ASTNode<Params>[]) {
  let belongsToMany: BelongsToMany<Params> = Object.create (prototype);

  belongsToMany.table = table;
  belongsToMany.info = info;
  belongsToMany.members = members;

  return belongsToMany;
}

function caseOf(this: BelongsToMany<unknown>, structureMap: StringMap) {
  return structureMap.BelongsToMany (
    this.table,
    this.members,
    this.info
  );
}

BelongsToMany.isBelongsToMany = function <Params> (value: any): value is BelongsToMany<Params> {
  return value != null && value[refqlType] === type;
};

export default BelongsToMany;