import { refqlType } from "../common/consts";
import { RefQLRows, StringMap } from "../common/types";
import { RefInfo } from "../common/types2";
import { RQLTag } from "../RQLTag";
import sql from "../SQLTag/sql";
import Raw from "./Raw";
import Values from "./Values";

interface RefNode<Params, Output> {
  joinLateral(): RQLTag<any, Params, Output>;
  tag: RQLTag<any, Params, Output>;
  info: RefInfo<any>;
  single: boolean;
}

const type = "refql/RefNode";

export const refNodePrototype = {
  [refqlType]: type,
  joinLateral,
  caseOf
};

function RefNode<Params, Output>(info: RefInfo<any>, tag: RQLTag<any, Params, Output>, single: boolean) {
  let refNode: RefNode<Params, Output> = Object.create (refNodePrototype);

  refNode.info = info;
  refNode.tag = tag;
  refNode.single = single;

  return refNode;
}

function joinLateral<Params, Output>(this: RefNode<Params, Output>) {
  const { tag, next, extra } = this.tag.interpret ();
  const { rRef, lRef, parent } = this.info;

  const l1 = sql<Params & RefQLRows, Output>`
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

  const joined = sql<Params, Output>`
    select * from (${l1}) refqll1,
    lateral (${l2}) refqll2
  `;

  this.tag.interpreted = { tag: joined, next };

  return this.tag;
}

function caseOf<Params, Output>(this: RefNode<Params, Output>, structureMap: StringMap) {
  return structureMap.RefNode (this.joinLateral (), this.info, this.single);
}

RefNode.isRefNode = function <Params, Output> (x: any): x is RefNode<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default RefNode;