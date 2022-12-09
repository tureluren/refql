import { refqlType } from "../common/consts";
import { HasOneInfo, StringMap } from "../common/types";
import RQLTag from "../RQLTag";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface HasOne<Params> extends ASTNode<Params> {
  tag: RQLTag<Params, unknown>;
  info: HasOneInfo;
}

const type = "refql/HasOne";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: HasOne,
  [refqlType]: type,
  caseOf
});

function HasOne<Params>(info: HasOneInfo, tag: RQLTag<Params, unknown>) {
  let hasOne: HasOne<Params> = Object.create (prototype);

  hasOne.info = info;
  hasOne.tag = tag;

  return hasOne;
}

function caseOf(this: HasOne<unknown>, structureMap: StringMap) {
  return structureMap.HasOne (
    this.tag,
    this.info
  );
}

HasOne.isHasOne = function <Params> (value: any): value is HasOne<Params> {
  return value != null && value[refqlType] === type;
};

export default HasOne;