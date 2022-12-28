import { refqlType } from "../common/consts";
import { RefInfo, RefInput, RefMakerPair } from "../common/types";
import RQLTag from "../RQLTag";
import Table from "../Table";
import Ref from "./Ref";
import RefNode, { refNodePrototype } from "./RefNode";

interface HasOne<Params> extends RefNode<Params> {}

const type = "refql/HasOne";

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: HasOne,
  [refqlType]: type
});

function HasOne<Params>(info: RefInfo, tag: RQLTag<Params>) {
  let hasOne: HasOne<Params> = Object.create (prototype);

  hasOne.info = info;
  hasOne.tag = tag;

  return hasOne;
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
        parent,
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