import { refqlType } from "../common/consts.ts";
import { RefInfo, RefInput, RefMakerPair, StringMap } from "../common/types.ts";
import RQLTag from "../RQLTag/index.ts";
import Table from "../Table/index.ts";
import Ref from "./Ref.ts";
import RefNode, { createNextTag, refNodePrototype } from "./RefNode.ts";

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

type HasManyInput = Omit<RefInput, "lxRef" | "rxRef" | "xTable">;

export const hasMany = (table: string, info?: HasManyInput): RefMakerPair => {
  const hasManyInfo = info || {};
  const child = Table (table);

  const makeHasMany = (parent: Table, tag: RQLTag<unknown>, as?: string) => {
    as = as || hasManyInfo.as || `${child.name}s`;
    const refOf = Ref.refOf (as);

    return HasMany (
      {
        as,
        lRef: refOf (parent, "lref", hasManyInfo.lRef || "id"),
        rRef: refOf (child, "rref", hasManyInfo.rRef || `${parent.name}_id`)
      },
      tag
    );
  };

  return [child, makeHasMany];
};

export default HasMany;