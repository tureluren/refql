import { RefInfo, RefQLRows } from "../common/types.ts";
import RQLTag from "../RQLTag/index.ts";
import sql from "../SQLTag/sql.ts";
import ASTNode, { astNodePrototype } from "./ASTNode.ts";
import Raw from "./Raw.ts";
import Ref from "./Ref.ts";
import Values from "./Values.ts";

interface RefNode<Params> extends ASTNode<Params> {}

const refNode: symbol = Symbol ("@@RefNode");

export const refNodePrototype = Object.assign ({}, astNodePrototype, {
  [refNode]: true
});

export const rowValues = (lRef: Ref) => Values<RefQLRows> (p =>
  [...new Set (p.refQLRows.map (r => r[lRef.as]))]
);

export const createNextTag = <Params>(tag: RQLTag<Params>, info: RefInfo) => {
  const { rRef, lRef } = info;

  return tag.table<Params>`
    ${rRef}
    ${sql`
      where ${Raw (`${rRef.name}`)}
      in ${rowValues (lRef)}
    `}
  `.concat (tag);
};

export const isRefNode = function <Params> (value: any): value is RefNode<Params> {
  return value != null && !!value[refNode];
};

export default RefNode;