import { refqlType } from "../common/consts";
import { HasManyInfo, StringMap } from "../common/types";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface HasMany<Params> extends ASTNode<Params> {
  table: Table;
  members: ASTNode<Params>[];
  info: HasManyInfo;
}

const type = "refql/HasMany";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: HasMany,
  [refqlType]: type,
  caseOf
});


// MEMBERS MOET RQLTAG worden
function HasMany<Params>(table: Table, info: HasManyInfo, members: ASTNode<Params>[]) {
  let hasMany: HasMany<Params> = Object.create (prototype);

  hasMany.table = table;
  hasMany.info = info;
  hasMany.members = members;

  return hasMany;
}

function caseOf(this: HasMany<unknown>, structureMap: StringMap) {
  return structureMap.HasMany (
    this.table,
    this.members,
    this.info
  );
}

HasMany.isHasMany = function <Params> (value: any): value is HasMany<Params> {
  return value != null && value[refqlType] === type;
};

export default HasMany;