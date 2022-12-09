import { refqlType } from "../common/consts";
import { HasManyInfo, StringMap } from "../common/types";
import RQLTag from "../RQLTag";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface HasMany<Params> extends ASTNode<Params> {
  tag: RQLTag<Params, unknown>;
  info: HasManyInfo;
}

const type = "refql/HasMany";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: HasMany,
  [refqlType]: type,
  caseOf
});


function HasMany<Params>(info: HasManyInfo, tag: RQLTag<Params, unknown>) {
  let hasMany: HasMany<Params> = Object.create (prototype);

  hasMany.info = info;
  hasMany.tag = tag;

  return hasMany;
}

function caseOf(this: HasMany<unknown>, structureMap: StringMap) {
  return structureMap.HasMany (
    this.tag,
    this.info
  );
}

HasMany.isHasMany = function <Params> (value: any): value is HasMany<Params> {
  return value != null && value[refqlType] === type;
};

export default HasMany;