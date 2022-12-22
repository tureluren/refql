import { refqlType } from "../common/consts.ts";
import { RefInfo, RefInput, RefMakerPair, StringMap } from "../common/types.ts";
import RQLTag from "../RQLTag/index.ts";
import sql from "../SQLTag/sql.ts";
import Table from "../Table/index.ts";
import Raw from "./Raw.ts";
import Ref from "./Ref.ts";
import RefNode, { refNodePrototype, rowValues } from "./RefNode.ts";

interface BelongsToMany<Params> extends RefNode<Params> {
  tag: RQLTag<Params>;
  info: Required<RefInfo>;
}

const type = "refql/BelongsToMany";

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: BelongsToMany,
  [refqlType]: type,
  caseOf
});

function BelongsToMany<Params>(info: Required<RefInfo>, tag: RQLTag<Params>) {
  let belongsToMany: BelongsToMany<Params> = Object.create (prototype);

  belongsToMany.tag = tag;
  belongsToMany.info = info;

  return belongsToMany;
}

const createNextTagX = <Params>(tag: RQLTag<Params>, info: Required<RefInfo>) => {
  const { lRef, rRef, lxRef, rxRef, xTable } = info;

  return tag.table<Params>`
    ${lxRef}
    ${sql`
      ${Raw (`join ${xTable.name} on ${rxRef.name} = ${rRef.name} where ${lxRef!.name}`)}
      in ${rowValues (lRef)}
    `}
  `.concat (tag);
};

function caseOf(this: BelongsToMany<unknown>, structureMap: StringMap) {
  return structureMap.BelongsToMany (
    createNextTagX (this.tag, this.info),
    this.info
  );
}

BelongsToMany.isBelongsToMany = function <Params> (value: any): value is BelongsToMany<Params> {
  return value != null && value[refqlType] === type;
};

type BelongsToManyInput = RefInput;

export const belongsToMany = (table: string, info?: BelongsToManyInput): RefMakerPair => {
  const belongsToManyInfo = info || {};
  const child = Table (table);

  const makeBelongsToMany = (parent: Table, tag: RQLTag<unknown>, as?: string) => {
    as = as || belongsToManyInfo.as || `${child.name}s`;
    const refOf = Ref.refOf (as);

    const xTable = Table (
      belongsToManyInfo.xTable ||
      (parent.name < child.name ? `${parent.name}_${child.name}` : `${child.name}_${parent.name}`)
    );

    return BelongsToMany (
      {
        as,
        xTable,
        lRef: refOf (parent, "lref", belongsToManyInfo.lRef || "id"),
        rRef: refOf (child, "rref", belongsToManyInfo.rRef || "id"),
        lxRef: refOf (xTable, "lxref", belongsToManyInfo.lxRef || `${parent.name}_id`),
        rxRef: refOf (xTable, "rxref", belongsToManyInfo.rxRef || `${child.name}_id`)
      },
      tag
    );
  };

  return [child, makeBelongsToMany];
};

export default BelongsToMany;