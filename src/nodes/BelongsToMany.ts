import { refqlType } from "../common/consts";
import { RefInfo, StringMap } from "../common/types";
import RQLTag from "../RQLTag";
import RefNode, { createNextTagX, refNodePrototype } from "./RefNode";

interface BelongsToMany<Params> extends RefNode<Params> {
  tag: RQLTag<Params>;
  info: Required<RefInfo>;
}

const type = "refql/BelongsToMany";

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: BelongsToMany,
  [refqlType]: type,
  caseOf
});

function BelongsToMany<Params>(info: Required<RefInfo>, tag: RQLTag<Params>) {
  let belongsToMany: BelongsToMany<Params> = Object.create (prototype);

  belongsToMany.tag = tag;
  belongsToMany.info = info;

  return belongsToMany;
}

function caseOf(this: BelongsToMany<unknown>, structureMap: StringMap) {
  return structureMap.BelongsToMany (
    createNextTagX (this.tag, this.info),
    this.info
  );
}

BelongsToMany.isBelongsToMany = function <Params> (value: any): value is BelongsToMany<Params> {
  return value != null && value[refqlType] === type;
};

export default BelongsToMany;