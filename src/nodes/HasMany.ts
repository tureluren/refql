import { refqlType } from "../common/consts";
import { RefInfo, StringMap } from "../common/types";
import RQLTag from "../RQLTag";
import RefNode, { createNextTag, refNodePrototype } from "./RefNode";

interface HasMany<Params> extends RefNode<Params> {
  tag: RQLTag<Params>;
  info: RefInfo;
}

const type = "refql/HasMany";

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: HasMany,
  [refqlType]: type,
  caseOf
});


function HasMany<Params>(info: RefInfo, tag: RQLTag<Params>) {
  let hasMany: HasMany<Params> = Object.create (prototype);

  hasMany.info = info;
  hasMany.tag = tag;

  return hasMany;
}

function caseOf(this: HasMany<unknown>, structureMap: StringMap) {
  return structureMap.HasMany (
    createNextTag (this.tag, this.info),
    this.info
  );
}

HasMany.isHasMany = function <Params> (value: any): value is HasMany<Params> {
  return value != null && value[refqlType] === type;
};

export default HasMany;