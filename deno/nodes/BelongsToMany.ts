import { Ref, RefInfo, RefInput, RefQLRows, StringMap } from "../common/types.ts";
import validateTable from "../common/validateTable.ts";
import RefField from "../RefField/index.ts";
import RQLTag from "../RQLTag/index.ts";
import sql from "../SQLTag/sql.ts";
import Table from "../Table/index.ts";
import Raw from "./Raw.ts";
import RefNode, { refNodePrototype, validateRefInput } from "./RefNode.ts";
import Values from "./Values.ts";

interface BelongsToMany<Params = unknown, Output = unknown> extends RefNode<Params, Output> {
  info: Required<RefInfo>;
}

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: BelongsToMany,
  joinLateral,
  caseOf
});

function BelongsToMany<Params, Output>(info: Required<RefInfo>, tag: RQLTag<Params, Output>, single: boolean) {
  let belongsToMany: BelongsToMany<Params, Output> = Object.create (prototype);

  belongsToMany.tag = tag;
  belongsToMany.info = info;
  belongsToMany.single = single;

  return belongsToMany;
}

function joinLateral(this: BelongsToMany) {
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

function caseOf(this: BelongsToMany, structureMap: StringMap) {
  return structureMap.BelongsToMany (this.joinLateral (), this.info, this.single);
}

type BelongsToManyInput = RefInput;

export const belongsToMany = (table: string, input: BelongsToManyInput = {}): Ref => {
  validateTable (table);

  validateRefInput (input);

  const child = Table (table);

  const makeBelongsToMany = (parent: Table, tag: RQLTag, as?: string, single?: boolean) => {
    as = as || input.as || `${child.name}s`;
    const refOf = RefField.refFieldOf (as);

    const xTable = Table (
      input.xTable ||
      (parent.name < child.name ? `${parent.name}_${child.name}` : `${child.name}_${parent.name}`)
    );

    return BelongsToMany (
      {
        parent,
        as,
        xTable,
        lRef: refOf (parent, "lref", input.lRef || "id"),
        rRef: refOf (child, "rref", input.rRef || "id"),
        lxRef: refOf (xTable, "lxref", input.lxRef || `${parent.name}_id`),
        rxRef: refOf (xTable, "rxref", input.rxRef || `${child.name}_id`)
      },
      tag,
      typeof single === "undefined" ? false : true
    );
  };

  return [child, makeBelongsToMany];
};

export default BelongsToMany;