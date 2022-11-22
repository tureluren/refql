import { refqlType } from "../common/consts";
import { HasOneInfo, StringMap } from "../common/types";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface HasOne<Params> extends ASTNode<Params> {
  table: Table;
  members: ASTNode<Params>[];
  info: HasOneInfo;
}

const hasOneType = "refql/HasOne";

const hasOnePrototype = Object.assign ({}, astNodePrototype, {
  constructor: HasOne,
  [refqlType]: hasOneType,
  caseOf
});

function HasOne<Params>(table: Table, info: HasOneInfo, members: ASTNode<Params>[]) {
  let hasOne: HasOne<Params> = Object.create (hasOnePrototype);

  hasOne.table = table;
  hasOne.info = info;
  hasOne.members = members;

  return hasOne;
}

function caseOf(this: HasOne<unknown>, structureMap: StringMap) {
  return structureMap.HasOne (
    this.table,
    this.members,
    this.info
  );
}

HasOne.isHasOne = function <Params> (value: any): value is HasOne<Params> {
  return value != null && value[refqlType] === hasOneType;
};

export default HasOne;