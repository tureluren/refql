import { refqlType } from "../common/consts";
import { RefInfo, RefInput, RefMakerPair } from "../common/types";
import RQLTag from "../RQLTag";
import Table from "../Table";
import Ref from "./Ref";
import RefNode, { refNodePrototype } from "./RefNode";

interface HasMany<Params> extends RefNode<Params> {}

const type = "refql/HasMany";

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: HasMany,
  [refqlType]: type
});

function HasMany<Params>(info: RefInfo, tag: RQLTag<Params>) {
  let hasMany: HasMany<Params> = Object.create (prototype);

  hasMany.info = info;
  hasMany.tag = tag;

  return hasMany;
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
        parent,
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