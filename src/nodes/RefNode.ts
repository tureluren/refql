import { RefInfo, RefQLRows } from "../common/types";
import RQLTag from "../RQLTag";
import sql from "../SQLTag/sql";
import ASTNode, { astNodePrototype } from "./ASTNode";
import Raw from "./Raw";
import Ref from "./Ref";
import Values from "./Values";

interface RefNode<Params> extends ASTNode<Params> {}

const refNode: symbol = Symbol ("@@RefNode");

export const refNodePrototype = Object.assign ({}, astNodePrototype, {
  [refNode]: true
});

const rowValues = (lRef: Ref) => Values<RefQLRows> (p =>
  [...new Set (p.refQLRows.map (r => r[lRef.as]))]
);

export const createNextTagX = <Params>(tag: RQLTag<Params>, info: Required<RefInfo>) => {
  const { lRef, rRef, lxRef, rxRef, xTable } = info;

  return tag.table<Params>`
    ${lxRef}
    ${sql`
      ${Raw (`
        join ${xTable.name}
        on ${rxRef.name} = ${rRef.name}
        where ${lxRef!.name}
      `)}
      in ${rowValues (lRef)}
    `}
  `.concat (tag);
};

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
  return value != null && value[refNode];
};

export default RefNode;