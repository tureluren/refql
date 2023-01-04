import { RefInfo, RefInput, RefMakerPair, RefQLRows, StringMap } from "../common/types";
import Ref from "../Ref";
import RQLTag from "../RQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";
import Raw from "./Raw";
import RefNode, { refNodePrototype } from "./RefNode";
import Values from "./Values";

interface BelongsToMany<Params> extends RefNode<Params> {
  info: Required<RefInfo>;
}

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: BelongsToMany,
  joinLateral,
  caseOf
});

function BelongsToMany<Params>(info: Required<RefInfo>, tag: RQLTag<Params>) {
  let belongsToMany: BelongsToMany<Params> = Object.create (prototype);

  belongsToMany.tag = tag;
  belongsToMany.info = info;
  belongsToMany.single = false;

  return belongsToMany;
}

function joinLateral(this: BelongsToMany<unknown>) {
  const { tag, next, extra } = this.tag.interpret ();
  const { rRef, lRef, xTable, rxRef, lxRef, parent } = this.info;

  const l1 = sql`
    select distinct ${Raw (lRef)}
    from ${Raw (parent)}
    where ${Raw (lRef.name)}
    in ${Values<RefQLRows> (p => [...new Set (p.refQLRows.map (r => r[lRef.as]))])}
  `;

  const l2 = tag
    .concat (sql`
      join ${Raw (`${xTable} on ${rxRef.name} = ${rRef.name}`)}
      where ${Raw (`${lxRef.name} = refqll1.${lRef.as}`)}
    `)
    .concat (extra);

  const joined = sql`
    select * from (${l1}) refqll1,
    lateral (${l2}) refqll2
  `;

  this.tag.interpreted = { tag: joined, next };

  return this.tag;
}

function caseOf(this: BelongsToMany<unknown>, structureMap: StringMap) {
  return structureMap.BelongsToMany (this.joinLateral (), this.info, this.single);
}

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