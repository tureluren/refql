import { refqlType } from "../common/consts";
import { RefQLRows, StringMap } from "../common/types";
import { RefInfo, RefInput } from "../common/types2";
import RefField from "../RefField";
import { RQLTag } from "../RQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";
import RefProp from "../Table/RefProp";
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

function RefNode<Params, Output>(tag: RQLTag<any, Params, Output>, parent: Table) {
  let refNode: RefNode<Params, Output> = Object.create (refNodePrototype);

  const refProp = Object.keys (parent.props)
    .map (key => parent.props[key as keyof typeof parent.props])
    .filter (prop => RefProp.isRefProp (prop))
    .map ((prop: RefProp) => {
      const rpChild = typeof prop.child === "string" ? Table (prop.child, []) : prop.child ();
      return {
        ...prop,
        child: rpChild
      };
    })
    .find (prop => {
      return tag.table.equals (prop.child);
    });

  if (typeof refProp === "undefined") {
    throw Error ("wrong");
  }


  const { as, rel, child, refInput } = refProp;

  const refOf = RefField.refFieldOf (as);

  if (rel === "BelongsTo") {
    refNode.info = {
      parent,
      as,
      lRef: refOf (parent, "lref", refInput.lRef || `${child.name}_id`),
      rRef: refOf (child, "rref", refInput.rRef || "id")
    };

    refNode.single = true;

  } else if (rel === "HasOne") {
    refNode.info = {
      parent,
      as,
      lRef: refOf (parent, "lref", refInput.lRef || "id"),
      rRef: refOf (child, "rref", refInput.rRef || `${parent.name}_id`)
    };

    refNode.single = true;

  } else if (rel === "HasMany") {
    refNode.info = {
      parent,
      as,
      lRef: refOf (parent, "lref", refInput.lRef || "id"),
      rRef: refOf (child, "rref", refInput.rRef || `${parent.name}_id`)
    };

    refNode.single = false;
  } else if (rel === "BelongsToMany") {
    let xTable: Table;
    const btmInput: RefInput = refInput;

    if (typeof btmInput.xTable === "undefined") {
      xTable = Table (parent.name < child.name ? `${parent.name}_${child.name}` : `${child.name}_${parent.name}`, []);
    } else {
      if (typeof btmInput.xTable === "string") {
        xTable = Table (btmInput.xTable, []);
      } else {
        xTable = btmInput.xTable ();
      }
    }

    refNode.info = {
      parent,
      as,
      xTable,
      lRef: refOf (parent, "lref", refInput.lRef || "id"),
      rRef: refOf (child, "rref", refInput.rRef || "id"),
      lxRef: refOf (xTable, "lxref", (refInput as RefInput).lxRef || `${parent.name}_id`),
      rxRef: refOf (xTable, "rxref", (refInput as RefInput).rxRef || `${child.name}_id`)
    };

    refNode.single = false;
  }

  refNode.tag = tag;

  return refNode;
}

function joinLateral<Params, Output>(this: RefNode<Params, Output>) {

  if (this.info.xTable) {
    const { tag, next, extra } = this.tag.interpret ();
    const { rRef, lRef, xTable, rxRef, lxRef, parent } = this.info as Required<RefInfo<any>>;

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

  } else {
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
}

function caseOf<Params, Output>(this: RefNode<Params, Output>, structureMap: StringMap) {
  return structureMap.RefNode (this.joinLateral (), this.info, this.single);
}

RefNode.isRefNode = function <Params, Output> (x: any): x is RefNode<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default RefNode;