import { refqlType } from "../common/consts";
import { RefInfo, StringMap } from "../common/types";
import RQLTag from "../RQLTag";
import RefNode, { createNextTag, refNodePrototype } from "./RefNode";

interface BelongsTo<Params> extends RefNode<Params> {
  tag: RQLTag<Params>;
  info: RefInfo;
}

const type = "refql/BelongsTo";

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: BelongsTo,
  [refqlType]: type,
  caseOf
});

function BelongsTo<Params>(info: RefInfo, tag: RQLTag<Params>) {
  let belongsTo: BelongsTo<Params> = Object.create (prototype);

  belongsTo.info = info;
  belongsTo.tag = tag;

  return belongsTo;
}

function caseOf(this: BelongsTo<unknown>, structureMap: StringMap) {
  return structureMap.BelongsTo (
    createNextTag (this.tag, this.info),
    this.info
  );
}

BelongsTo.isBelongsTo = function<Params> (value: any): value is BelongsTo<Params> {
  return value != null && value[refqlType] === type;
};

export default BelongsTo;