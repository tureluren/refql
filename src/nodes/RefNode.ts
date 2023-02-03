import { refqlType } from "../common/consts";
import { RefInfo, RefInput, RefMaker, RefMakerPair, RefQLRows, RQLTagMaker, Runnable, StringMap } from "../common/types";
import validateTable from "../common/validateTable";
import Ref from "../Ref";
import RQLTag from "../RQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";
import Raw from "./Raw";
import Values from "./Values";

interface RefNode<Params= unknown, Output = unknown> extends ASTNode<Params, Output> {
  joinLateral(): RQLTag<Params, Output>;
  tag: RQLTag<Params, Output>;
  info: RefInfo;
  single: boolean;
}

const type = "refql/RefNode";

export const refNodePrototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  joinLateral,
  caseOf
});

function RefNode<Params, Output>(info: RefInfo, tag: RQLTag<Params, Output>, single: boolean) {
  let refNode: RefNode<Params, Output> = Object.create (refNodePrototype);

  refNode.info = info;
  refNode.tag = tag;
  refNode.single = single;

  return refNode;
}

function joinLateral(this: RefNode) {
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
    .concat (extra);

  const joined = sql`
    select * from (${l1}) refqll1,
    lateral (${l2}) refqll2
  `;

  this.tag.interpreted = { tag: joined, next };

  return this.tag;
}

function caseOf(this: RefNode, structureMap: StringMap) {
  return structureMap.RefNode (this.joinLateral (), this.info, this.single);
}

RefNode.isRefNode = function <Params, Output> (x: any): x is RefNode<Params, Output> {
  return x != null && x[refqlType] === type;
};

type RefNodeInput = Omit<RefInput, "lxRef" | "rxRef" | "xTable">;

export const validateRefInput = (input: RefInput) => {
  if (!(toString.call (input) === "[object Object]")) {
    throw new Error ("Invalid input: input is not an object");
  }

  if ("as" in input && typeof input.as !== "string") {
    throw new Error ("Invalid input: as is not a string");
  }

  if ("lRef" in input && typeof input.lRef !== "string") {
    throw new Error ("Invalid input: lRef is not a string");
  }

  if ("rRef" in input && typeof input.rRef !== "string") {
    throw new Error ("Invalid input: rRef is not a string");
  }

  if ("xTable" in input && typeof input.xTable !== "string") {
    throw new Error ("Invalid input: xTable is not a string");
  }

  if ("lxRef" in input && typeof input.lxRef !== "string") {
    throw new Error ("Invalid input: lxRef is not a string");
  }

  if ("rxRef" in input && typeof input.rxRef !== "string") {
    throw new Error ("Invalid input: rxRef is not a string");
  }
};

const makeBelongsTo = (child: Table, input: RefNodeInput) => (parent: Table, tag: RQLTag, as?: string) => {
  as = as || input.as || child.name;
  const refOf = Ref.refOf (as);

  return RefNode (
    {
      parent,
      as,
      lRef: refOf (parent, "lref", input.lRef || `${child.name}_id`),
      rRef: refOf (child, "rref", input.rRef || "id")
    },
    tag,
    true
  );
};

const makeHasMany = (child: Table, input: RefNodeInput) => (parent: Table, tag: RQLTag, as?: string, single?: boolean) => {
  as = as || input.as || `${child.name}s`;
  const refOf = Ref.refOf (as);

  return RefNode (
    {
      parent,
      as,
      lRef: refOf (parent, "lref", input.lRef || "id"),
      rRef: refOf (child, "rref", input.rRef || `${parent.name}_id`)
    },
    tag,
    typeof single === "undefined" ? false : true
  );
};

const makeHasOne = (child: Table, input: RefNodeInput) => (parent: Table, tag: RQLTag, as?: string) => {
  as = as || input.as || child.name;
  const refOf = Ref.refOf (as);

  return RefNode (
    {
      parent,
      as,
      lRef: refOf (parent, "lref", input.lRef || "id"),
      rRef: refOf (child, "rref", input.rRef || `${parent.name}_id`)
    },
    tag,
    true
  );
};

const makeRefNode = (f: (child: Table, input: RefNodeInput) => RefMaker) => (table: string | Table & RQLTagMaker, input: RefNodeInput = {}): RefMakerPair => {
  validateTable (table);

  validateRefInput (input);

  const child = Table.isTable (table) ? table : Table (table);

  return [child, f (child, input)];
};

export const belongsTo = makeRefNode (makeBelongsTo);
export const hasMany = makeRefNode (makeHasMany);
export const hasOne = makeRefNode (makeHasOne);

export default RefNode;