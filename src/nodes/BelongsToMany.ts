// @ts-nocheck
import { Ref, RefInfo, RefInput, RefQLRows, StringMap } from "../common/types";
import validateTable from "../common/validateTable";
import RefField from "../RefField";
import RQLTag from "../RQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";
import Raw from "./Raw";
import RefNode, { refNodePrototype, validateRefInput } from "./RefNode";
import Values from "./Values";

interface BelongsToMany<Params, Output> extends RefNode<Params, Output> {
  info: Required<RefInfo>;
}

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: BelongsToMany,
  joinLateral,
  caseOf
});

function BelongsToMany<Params, Output>(info: Required<RefInfo>, tag: RQLTag<any, Params, Output>, single: boolean) {
  let belongsToMany: BelongsToMany<Params, Output> = Object.create (prototype);

  belongsToMany.tag = tag;
  belongsToMany.info = info;
  belongsToMany.single = single;

  return belongsToMany;
}

function joinLateral<Params, Output>(this: BelongsToMany<Params, Output>) {
  const { tag, next, extra } = this.tag.interpret ();
  const { rRef, lRef, xTable, rxRef, lxRef, parent } = this.info;

  const l1 = sql<Params & RefQLRows, Output>`
    select distinct ${Raw (lRef)}
    from ${Raw (parent)}
    where ${Raw (lRef.name)}
    in ${Values (p => [...new Set (p.refQLRows.map (r => r[lRef.as]))])}
  `;

  const l2 = tag
    .concat (sql<Params, Output>`
      join ${Raw (`${xTable} on ${rxRef.name} = ${rRef.name}`)}
      where ${Raw (`${lxRef.name} = refqll1.${lRef.as}`)}
    `)
    .concat (extra);

  const joined = sql<Params, Output>`
    select * from (${l1}) refqll1,
    lateral (${l2}) refqll2
  `;

  this.tag.interpreted = { tag: joined, next };

  return this.tag;
}

function caseOf<Params, Output>(this: BelongsToMany<Params, Output>, structureMap: StringMap) {
  return structureMap.BelongsToMany (this.joinLateral (), this.info, this.single);
}

type BelongsToManyInput = RefInput;

export const belongsToMany = (table: string, input: BelongsToManyInput = {}): Ref => {
  validateTable (table);

  validateRefInput (input);

  const child = Table (table);

  const makeBelongsToMany = <Params, Output>(parent: Table, tag: RQLTag<any, Params, Output>, as?: string, single?: boolean) => {
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