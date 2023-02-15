import { Boxes } from "../common/BoxRegistry.ts";
import { refqlType } from "../common/consts.ts";
import { Ref, RefInfo, RefInput, RefMaker, RefQLRows, StringMap } from "../common/types.ts";
import validateTable from "../common/validateTable.ts";
import RefField from "../RefField/index.ts";
import RQLTag from "../RQLTag/index.ts";
import sql from "../SQLTag/sql.ts";
import Table from "../Table/index.ts";
import ASTNode, { astNodePrototype } from "./ASTNode.ts";
import Raw from "./Raw.ts";
import Values from "./Values.ts";

interface RefNode<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box> {
  joinLateral(): RQLTag<Params, Output, Box>;
  tag: RQLTag<Params, Output, Box>;
  info: RefInfo<Box>;
  single: boolean;
}

const type = "refql/RefNode";

export const refNodePrototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  joinLateral,
  caseOf
});

function RefNode<Params, Output, Box extends Boxes>(info: RefInfo<Box>, tag: RQLTag<Params, Output, Box>, single: boolean) {
  let refNode: RefNode<Params, Output, Box> = Object.create (refNodePrototype);

  refNode.info = info;
  refNode.tag = tag;
  refNode.single = single;

  return refNode;
}

function joinLateral<Params, Output, Box extends Boxes>(this: RefNode<Params, Output, Box>) {
  const { tag, next, extra } = this.tag.interpret ();
  const { rRef, lRef, parent } = this.info;

  const l1 = sql<Params & RefQLRows, Output, Box>`
    select distinct ${Raw (lRef)}
    from ${Raw (parent)}
    where ${Raw (lRef.name)}
    in ${Values (p => [...new Set (p.refQLRows.map (r => r[lRef.as]))])}
  `;

  const l2 = tag
    .concat (sql`
      where ${Raw (`${rRef.name} = refqll1.${lRef.as}`)}
    `)
    .concat (extra);

  const joined = sql<Params, Output, Box>`
    select * from (${l1}) refqll1,
    lateral (${l2}) refqll2
  `;

  this.tag.interpreted = { tag: joined, next };

  return this.tag;
}

function caseOf<Params, Output, Box extends Boxes>(this: RefNode<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.RefNode (this.joinLateral (), this.info, this.single);
}

RefNode.isRefNode = function <Params, Output, Box extends Boxes> (x: any): x is RefNode<Params, Output, Box> {
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

const makeBelongsTo = <Box extends Boxes = "Promise">(child: Table<Box>, input: RefNodeInput) => <Params, Output>(parent: Table<Box>, tag: RQLTag<Params, Output, Box>, as?: string) => {
  as = as || input.as || child.name;
  const refOf = RefField.refFieldOf (as);

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

const makeHasMany = <Box extends Boxes = "Promise">(child: Table<Box>, input: RefNodeInput) => <Params, Output>(parent: Table<Box>, tag: RQLTag<Params, Output, Box>, as?: string, single?: boolean) => {
  as = as || input.as || `${child.name}s`;
  const refOf = RefField.refFieldOf (as);

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

const makeHasOne = <Box extends Boxes = "Promise">(child: Table<Box>, input: RefNodeInput) => <Params, Output>(parent: Table<Box>, tag: RQLTag<Params, Output, Box>, as?: string) => {
  as = as || input.as || child.name;
  const refOf = RefField.refFieldOf (as);

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

const makeRefNode = <Box extends Boxes>(f: (child: Table<Box>, input: RefNodeInput) => RefMaker<Box>) => (table: string, input: RefNodeInput = {}): Ref<Box> => {
  validateTable (table);

  validateRefInput (input);

  const child = Table<Box> (table);

  return [child, f (child, input)];
};

export const belongsTo = makeRefNode (makeBelongsTo);
export const hasMany = makeRefNode (makeHasMany);
export const hasOne = makeRefNode (makeHasOne);

export default RefNode;