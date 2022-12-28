import { refqlType } from "../common/consts";
import { RefInfo, RefInput, RefMakerPair } from "../common/types";
import RQLTag from "../RQLTag";
import Table from "../Table";
import Ref from "./Ref";
import RefNode, { refNodePrototype } from "./RefNode";

interface BelongsTo<Params> extends RefNode<Params> {}

const type = "refql/BelongsTo";

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: BelongsTo,
  [refqlType]: type
});

function BelongsTo<Params>(info: RefInfo, tag: RQLTag<Params>) {
  let belongsTo: BelongsTo<Params> = Object.create (prototype);

  belongsTo.info = info;
  belongsTo.tag = tag;

  return belongsTo;
}

BelongsTo.isBelongsTo = function<Params> (value: any): value is BelongsTo<Params> {
  return value != null && value[refqlType] === type;
};

type BelongsToInput = Omit<RefInput, "lxRef" | "rxRef" | "xTable">;

export const belongsTo = (table: string, info?: BelongsToInput): RefMakerPair => {
  const belongsToInfo = info || {};
  const child = Table (table);

  const makeBelongsTo = (parent: Table, tag: RQLTag<unknown>, as?: string) => {
    as = as || belongsToInfo.as || child.name;
    const refOf = Ref.refOf (as);

    return BelongsTo (
      {
        parent,
        as,
        lRef: refOf (parent, "lref", belongsToInfo.lRef || `${child.name}_id`),
        rRef: refOf (child, "rref", belongsToInfo.rRef || "id")
      },
      tag
    );
  };

  return [child, makeBelongsTo];
};

export default BelongsTo;