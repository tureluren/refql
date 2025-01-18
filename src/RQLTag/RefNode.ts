import { refqlType } from "../common/consts";
import { RefInfo, RefInput, RefQLRows } from "../common/types";
import RefProp from "../Prop/RefProp";
import { RQLTag } from "../RQLTag";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import Values from "../SQLTag/Values";
import Table from "../Table";
import RefField from "./RefField";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface RefNode extends RQLNode {
  joinLateral(): RQLTag;
  tag: RQLTag;
  info: RefInfo;
  single: boolean;
}

const type = "refql/RefNode";

const prototype = Object.assign ({}, rqlNodePrototype, {
  [refqlType]: type,
  joinLateral
});

function RefNode(tag: RQLTag, refProp: RefProp, parent: Table) {
  let refNode: RefNode = Object.create (prototype);

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
  } else {
    // rel === "BelongsToMany"

    let xTable: Table;
    const btmInput: RefInput = refInput;

    if (typeof btmInput.xTable === "undefined") {
      xTable = Table (parent.name < child.name ? `${parent.name}_${child.name}` : `${child.name}_${parent.name}`, []);
    } else {
      xTable = Table (btmInput.xTable, []);
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

function joinLateral(this: RefNode) {
  if (this.info.xTable) {
    const { tag, next, selectables, props } = this.tag.interpret ();
    const { rRef, lRef, xTable, rxRef, lxRef, parent } = this.info as Required<RefInfo>;

    const l1 = sql<RefQLRows>`
      select distinct ${Raw (lRef)}
      from ${Raw (parent)}
      where ${Raw (lRef.name)}
      in ${Values (p => [...new Set (p.refQLRows.map (r => r[lRef.as]))])}
    `;

    const l2 = tag
      .concat (sql`
        join ${Raw (`${xTable} on ${rxRef.name} = ${rRef.name}`)}
        where ${Raw (`${lxRef.name} = refqll1.${lRef.as}`)}
      `);

    const joined = sql`
      select * from (${l1}) refqll1,
      lateral (${l2}
    `;

    this.tag.interpreted = { tag: joined, next, selectables, ending: ") refqll2", props };

    return this.tag;

  } else {
    const { tag, next, selectables, props } = this.tag.interpret ();
    const { rRef, lRef, parent } = this.info;

    const l1 = sql<RefQLRows>`
      select distinct ${Raw (lRef)}
      from ${Raw (parent)}
      where ${Raw (lRef.name)}
      in ${Values (p => [...new Set (p.refQLRows.map (r => r[lRef.as]))])}
    `;

    const l2 = tag
      .concat (sql`
        where ${Raw (`${rRef.name} = refqll1.${lRef.as}`)}
      `);

    const joined = sql`
      select * from (${l1}) refqll1,
      lateral (${l2}
    `;

    this.tag.interpreted = { props, tag: joined, next, selectables, ending: ") refqll2" };

    return this.tag;
  }
}

RefNode.isRefNode = function (x: any): x is RefNode {
  return x != null && x[refqlType] === type;
};

export default RefNode;