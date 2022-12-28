import { refqlType } from "../common/consts";
import { RefInfo, RefInput, RefMakerPair, StringMap } from "../common/types";
import RQLTag, { concatExtra } from "../RQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";
import Raw from "./Raw";
import Ref from "./Ref";
import RefNode, { refNodePrototype, rowValues } from "./RefNode";

interface BelongsToMany<Params> extends RefNode<Params> {
  info: Required<RefInfo>;
}

const type = "refql/BelongsToMany";

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: BelongsToMany,
  [refqlType]: type,
  joinLateral,
  caseOf
});

function BelongsToMany<Params>(info: Required<RefInfo>, tag: RQLTag<Params>) {
  let belongsToMany: BelongsToMany<Params> = Object.create (prototype);

  belongsToMany.tag = tag;
  belongsToMany.info = info;

  return belongsToMany;
}

function joinLateral(this: BelongsToMany<unknown>) {
  const { tag, next, extra } = this.tag.interpret ();
  const { rRef, lRef, xTable, rxRef, lxRef, parent } = this.info;

  const l1 = sql`
    select distinct ${Raw (lRef)}
    from ${Raw (parent)}
    where ${Raw (lRef.name)}
    in ${rowValues (lRef)}
  `;

  const l2 = tag
    .concat (sql`
      join ${Raw (`${xTable} on ${rxRef.name} = ${rRef.name}`)}
      where ${Raw (`${lxRef.name} = refqll1.${lRef.as}`)}
    `)
    .concat (concatExtra (extra, true));

  const joined = sql`
    select * from (${l1}) refqll1,
    lateral (${l2}) refqll2
  `;

  this.tag.interpreted = { tag: joined, next };

  return this.tag;
}

function caseOf(this: BelongsToMany<unknown>, structureMap: StringMap) {
  return structureMap.BelongsToMany (
    this.joinLateral (),
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
        parent,
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