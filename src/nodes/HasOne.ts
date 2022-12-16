import { refqlType } from "../common/consts";
import { RefInfo, StringMap } from "../common/types";
import RQLTag from "../RQLTag";
import RefNode, { createNextTag, refNodePrototype } from "./RefNode";

interface HasOne<Params> extends RefNode<Params> {
  tag: RQLTag<Params>;
  info: RefInfo;
}

const type = "refql/HasOne";

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: HasOne,
  [refqlType]: type,
  caseOf
});

function HasOne<Params>(info: RefInfo, tag: RQLTag<Params>) {
  let hasOne: HasOne<Params> = Object.create (prototype);

  hasOne.info = info;
  hasOne.tag = tag;

  return hasOne;
}

function caseOf(this: HasOne<unknown>, structureMap: StringMap) {
  return structureMap.HasOne (
    createNextTag (this.tag, this.info),
    this.info
  );
}

HasOne.isHasOne = function <Params> (value: any): value is HasOne<Params> {
  return value != null && value[refqlType] === type;
};

export default HasOne;