import { refqlType } from "../common/consts";
import { RefInfo, RefInput, RefMaker, RefMakerPair, RefQLRows, StringMap } from "../common/types";
import Ref from "../Ref";
import RQLTag, { concatExtra } from "../RQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";
import Raw from "./Raw";
import Values from "./Values";

interface RefNode<Params> extends ASTNode<Params> {
  joinLateral(): RQLTag<Params>;
  tag: RQLTag<Params>;
  info: RefInfo;
  single: boolean;
}

const type = "refql/RefNode";

export const refNodePrototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  joinLateral,
  caseOf
});

function RefNode<Params>(info: RefInfo, tag: RQLTag<Params>, single: boolean) {
  let refNode: RefNode<Params> = Object.create (refNodePrototype);

  refNode.info = info;
  refNode.tag = tag;
  refNode.single = single;

  return refNode;
}

function joinLateral(this: RefNode<unknown>) {
  const { tag, next, extra } = this.tag.interpret ();
  const { rRef, lRef, parent } = this.info;

  const l1 = sql`
    select distinct ${Raw (lRef)}
    from ${Raw (parent)}
    where ${Raw (lRef.name)}
    in ${Values<RefQLRows> (p => [...new Set (p.refQLRows.map (r => r[lRef.as]))])}
  `;

  const l2 = tag
    .concat (sql`
      where ${Raw (`${rRef.name} = refqll1.${lRef.as}`)}
    `)
    .concat (concatExtra (extra, true));

  const joined = sql`
    select * from (${l1}) refqll1,
    lateral (${l2}) refqll2
  `;

  this.tag.interpreted = { tag: joined, next };

  return this.tag;
}

function caseOf(this: RefNode<unknown>, structureMap: StringMap) {
  return structureMap.RefNode (this.joinLateral (), this.info, this.single);
}

RefNode.isRefNode = function <Params> (value: any): value is RefNode<Params> {
  return value != null && value[refqlType] === type;
};

type RefNodeInput = Omit<RefInput, "lxRef" | "rxRef" | "xTable">;

const makeBelongsTo = (child: Table, info: RefNodeInput) => (parent: Table, tag: RQLTag<unknown>, as?: string) => {
  as = as || info.as || child.name;
  const refOf = Ref.refOf (as);

  return RefNode (
    {
      parent,
      as,
      lRef: refOf (parent, "lref", info.lRef || `${child.name}_id`),
      rRef: refOf (child, "rref", info.rRef || "id")
    },
    tag,
    true
  );
};

const makeHasMany = (child: Table, info: RefNodeInput) => (parent: Table, tag: RQLTag<unknown>, as?: string) => {
  as = as || info.as || `${child.name}s`;
  const refOf = Ref.refOf (as);

  return RefNode (
    {
      parent,
      as,
      lRef: refOf (parent, "lref", info.lRef || "id"),
      rRef: refOf (child, "rref", info.rRef || `${parent.name}_id`)
    },
    tag,
    false
  );
};

const makeHasOne = (child: Table, info: RefNodeInput) => (parent: Table, tag: RQLTag<unknown>, as?: string) => {
  as = as || info.as || child.name;
  const refOf = Ref.refOf (as);

  return RefNode (
    {
      parent,
      as,
      lRef: refOf (parent, "lref", info.lRef || "id"),
      rRef: refOf (child, "rref", info.rRef || `${parent.name}_id`)
    },
    tag,
    true
  );
};

const makeRefNode = (f: (child: Table, info: RefNodeInput) => RefMaker) => (table: string, info?: RefNodeInput): RefMakerPair => {
  const hasOneInfo = info || {};
  const child = Table (table);

  return [child, f (child, hasOneInfo)];
};

export const belongsTo = makeRefNode (makeBelongsTo);
export const hasMany = makeRefNode (makeHasMany);
export const hasOne = makeRefNode (makeHasOne);

export default RefNode;