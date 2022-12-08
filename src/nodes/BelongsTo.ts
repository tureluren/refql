import { refqlType } from "../common/consts";
import { BelongsToInfo, StringMap } from "../common/types";
import RQLTag from "../RQLTag";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface BelongsTo<Params> extends ASTNode<Params> {
  tag: RQLTag<Params, unknown>;
  info: BelongsToInfo;
}

const type = "refql/BelongsTo";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: BelongsTo,
  [refqlType]: type,
  caseOf
});

function BelongsTo<Params>(info: BelongsToInfo, tag: RQLTag<Params, unknown>) {
  let belongsTo: BelongsTo<Params> = Object.create (prototype);

  belongsTo.info = info;
  belongsTo.tag = tag;

  return belongsTo;
}

function caseOf(this: BelongsTo<unknown>, structureMap: StringMap) {
  return structureMap.BelongsTo (
    this.tag,
    this.info
  );
}

BelongsTo.isBelongsTo = function<Params> (value: any): value is BelongsTo<Params> {
  return value != null && value[refqlType] === type;
};

export default BelongsTo;