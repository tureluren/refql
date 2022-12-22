import { refqlType } from "../common/consts.ts";
import { RefInfo, RefInput, RefMakerPair, StringMap } from "../common/types.ts";
import RQLTag from "../RQLTag/index.ts";
import Table from "../Table/index.ts";
import Ref from "./Ref.ts";
import RefNode, { createNextTag, refNodePrototype } from "./RefNode.ts";

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

type HasOneInfoIput = Omit<RefInput, "lxRef" | "rxRef" | "xTable">;

export const hasOne = (table: string, info?: HasOneInfoIput): RefMakerPair => {
  const hasOneInfo = info || {};
  const child = Table (table);

  const makeHasOne = (parent: Table, tag: RQLTag<unknown>, as?: string) => {
    as = as || hasOneInfo.as || child.name;
    const refOf = Ref.refOf (as);

    return HasOne (
      {
        as,
        lRef: refOf (parent, "lref", hasOneInfo.lRef || "id"),
        rRef: refOf (child, "rref", hasOneInfo.rRef || `${parent.name}_id`)
      },
      tag
    );
  };

  return [child, makeHasOne];
};

export default HasOne;