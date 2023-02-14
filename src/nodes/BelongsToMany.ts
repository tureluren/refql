import { Boxes } from "../common/BoxRegistry";
import { Ref, RefInfo, RefInput, RefQLRows, StringMap } from "../common/types";
import validateTable from "../common/validateTable";
import RefField from "../RefField";
import RQLTag from "../RQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";
import Raw from "./Raw";
import RefNode, { refNodePrototype, validateRefInput } from "./RefNode";
import Values from "./Values";

interface BelongsToMany<Params, Output, Box extends Boxes> extends RefNode<Params, Output, Box> {
  info: Required<RefInfo<Box>>;
}

const prototype = Object.assign ({}, refNodePrototype, {
  constructor: BelongsToMany,
  joinLateral,
  caseOf
});

function BelongsToMany<Params, Output, Box extends Boxes>(info: Required<RefInfo<Box>>, tag: RQLTag<Params, Output, Box>, single: boolean) {
  let belongsToMany: BelongsToMany<Params, Output, Box> = Object.create (prototype);

  belongsToMany.tag = tag;
  belongsToMany.info = info;
  belongsToMany.single = single;

  return belongsToMany;
}

function joinLateral<Params, Output, Box extends Boxes>(this: BelongsToMany<Params, Output, Box>) {
  const { tag, next, extra } = this.tag.interpret ();
  const { rRef, lRef, xTable, rxRef, lxRef, parent } = this.info;

  const l1 = sql<Params & RefQLRows, Output, Box>`
    select distinct ${Raw (lRef)}
    from ${Raw (parent)}
    where ${Raw (lRef.name)}
    in ${Values (p => [...new Set (p.refQLRows.map (r => r[lRef.as]))])}
  `;

  const l2 = tag
    .concat (sql<Params, Output, Box>`
      join ${Raw (`${xTable} on ${rxRef.name} = ${rRef.name}`)}
      where ${Raw (`${lxRef.name} = refqll1.${lRef.as}`)}
    `)
    .concat (extra);

  const joined = sql<Params, Output, Box>`
    select * from (${l1}) refqll1,
    lateral (${l2}) refqll2
  `;

  this.tag.interpreted = { tag: joined, next };

  return this.tag;
}

function caseOf<Params, Output, Box extends Boxes>(this: BelongsToMany<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.BelongsToMany (this.joinLateral (), this.info, this.single);
}

type BelongsToManyInput = RefInput;

export const belongsToMany = <Box extends Boxes>(table: string, input: BelongsToManyInput = {}): Ref<Box> => {
  validateTable (table);

  validateRefInput (input);

  const child = Table<Box> (table);

  const makeBelongsToMany = <Params, Output>(parent: Table<Box>, tag: RQLTag<Params, Output, Box>, as?: string, single?: boolean) => {
    as = as || input.as || `${child.name}s`;
    const refOf = RefField.refFieldOf (as);

    const xTable = Table<Box> (
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