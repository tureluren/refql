import { RefInfo, RefQLRows } from "../common/types";
import RQLTag, { concatExtra } from "../RQLTag";
import sql from "../SQLTag/sql";
import ASTNode, { astNodePrototype } from "./ASTNode";
import Raw from "./Raw";
import Ref from "./Ref";
import Values from "./Values";

interface RefNode<Params> extends ASTNode<Params> {
  joinLateral(): RQLTag<Params>;
  tag: RQLTag<Params>;
  info: RefInfo;
}

const refNode: symbol = Symbol ("@@RefNode");

export const refNodePrototype = Object.assign ({}, astNodePrototype, {
  [refNode]: true,
  joinLateral
});

export const rowValues = (lRef: Ref) => Values<RefQLRows> (p =>
  [...new Set (p.refQLRows.map (r => r[lRef.as]))]
);

function joinLateral(this: RefNode<unknown>) {
  const { tag, next, extra } = this.tag.interpret ();
  const { rRef, lRef, parent } = this.info;

  const l1 = sql`
    select distinct ${Raw (lRef)}
    from ${Raw (parent)}
    where ${Raw (lRef.name)}
    in ${rowValues (lRef)}
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

export const isRefNode = function <Params> (value: any): value is RefNode<Params> {
  return value != null && !!value[refNode];
};

export default RefNode;