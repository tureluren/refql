import { refqlType } from "../common/consts";
import { BelongsToInfo, StringMap } from "../common/types";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface BelongsTo<Params> extends ASTNode<Params> {
  table: Table;
  members: ASTNode<Params>[];
  info: BelongsToInfo;
}

const belongsToType = "refql/BelongsTo";

const belongsToPrototype = Object.assign ({}, astNodePrototype, {
  constructor: BelongsTo,
  [refqlType]: belongsToType,
  caseOf
});

function BelongsTo<Params>(table: Table, info: BelongsToInfo, members: ASTNode<Params>[]) {
  let belongsTo: BelongsTo<Params> = Object.create (belongsToPrototype);

  belongsTo.table = table;
  belongsTo.info = info;
  belongsTo.members = members;

  return belongsTo;
}

function caseOf(this: BelongsTo<unknown>, structureMap: StringMap) {
  return structureMap.BelongsTo (
    this.table,
    this.members,
    this.info
  );
}

BelongsTo.isBelongsTo = function<Params> (value: any): value is BelongsTo<Params> {
  return value != null && value[refqlType] === belongsToType;
};

export default BelongsTo;