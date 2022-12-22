import { refqlType } from "../common/consts.ts";
import { RefInfo, RefInput, RefMakerPair, StringMap } from "../common/types.ts";
import RQLTag from "../RQLTag/index.ts";
import Table from "../Table/index.ts";
import Ref from "./Ref.ts";
import RefNode, { createNextTag, refNodePrototype } from "./RefNode.ts";

interface BelongsTo<Params> extends RefNode<Params> {
  tag: RQLTag<Params>;
  info: RefInfo;
}

const type = "refql/BelongsTo";

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: BelongsTo,
  [refqlType]: type,
  caseOf
});

function BelongsTo<Params>(info: RefInfo, tag: RQLTag<Params>) {
  let belongsTo: BelongsTo<Params> = Object.create (prototype);

  belongsTo.info = info;
  belongsTo.tag = tag;

  return belongsTo;
}

function caseOf(this: BelongsTo<unknown>, structureMap: StringMap) {
  return structureMap.BelongsTo (
    createNextTag (this.tag, this.info),
    this.info
  );
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