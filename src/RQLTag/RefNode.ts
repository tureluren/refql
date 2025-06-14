import { refqlType } from "../common/consts";
import { RefInfo, RefInput, RefQLRows } from "../common/types";
import RefProp from "../Prop/RefProp";
import { RQLTag } from "../RQLTag";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import Values from "../SQLTag/Values";
import { Table, TableX } from "../Table";
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
  let info: any = { parent, as };
  let single = false;

  function getRef(refs: string[] | undefined, table: Table, type: string, fallback: string) {
    return refs && refs.length > 0
      ? refs.map ((ref, idx) => refOf (table, type + (idx + 1), ref))
      : [refOf (table, type + "1", fallback)];
  }

  switch (rel) {
    case "BelongsTo":
      info.lRef = getRef (refInput.lRef, parent, "lref", `${child.name}_id`);
      info.rRef = getRef (refInput.rRef, child, "rref", "id");
      single = true;
      break;

    case "HasOne":
      info.lRef = getRef (refInput.lRef, parent, "lref", "id");
      info.rRef = getRef (refInput.rRef, child, "rref", `${parent.name}_id`);
      single = true;
      break;

    case "HasMany":
      info.lRef = getRef (refInput.lRef, parent, "lref", "id");
      info.rRef = getRef (refInput.rRef, child, "rref", `${parent.name}_id`);
      break;

    case "BelongsToMany":
      const btmInput: RefInput = refInput;
      const xTable = typeof btmInput.xTable === "undefined"
        ? TableX (parent.name < child.name ? `${parent.name}_${child.name}` : `${child.name}_${parent.name}`, [])
        : TableX (btmInput.xTable, []);

      Object.assign (info, {
        xTable,
        lRef: getRef (btmInput.lRef, parent, "lref", "id"),
        rRef: getRef (btmInput.rRef, child, "rref", "id"),
        lxRef: getRef (btmInput.lxRef, xTable, "lxref", `${parent.name}_id`),
        rxRef: getRef (btmInput.rxRef, xTable, "rxref", `${child.name}_id`)
      });
      break;
  }

  refNode.info = info;
  refNode.single = single;
  refNode.tag = tag;

  return refNode;
}

function joinLateral(this: RefNode) {
  if (this.info.xTable) {
    const { rRef, lRef, xTable, rxRef, lxRef, parent } = this.info as Required<RefInfo>;

    const l1 = lRef.reduce ((acc, lr, idx) => {
      const kw = idx === 0 ? "where" : "and";

      return acc.concat (sqlX<RefQLRows>`
        ${Raw (`${kw} ${lr.name}`)}
        in ${Values (p => [...new Set (p.refQLRows.map (r => r[lr.as]))])}
      `);
    }, sqlX<RefQLRows>`
      select distinct ${Raw (lRef.join (", "))}
      from ${Raw (parent)}
    `);

    const l2Join = rRef.reduce ((acc, rr, idx) => {
      const kw = idx === 0 ? "on" : "and";
      const rxr = rxRef[idx];

      return acc.concat (sqlX<RefQLRows>`
        ${Raw (`${kw} ${rxr.name} = ${rr.name}`)}
      `);
    }, sqlX<RefQLRows>`join ${Raw (xTable)}`);

    const l2where = lRef.reduce ((acc, lr, idx) => {
      const kw = idx === 0 ? "where" : "and";
      const lxr = lxRef[idx];

      return acc.concat (sqlX<RefQLRows>`
        ${Raw (`${kw} ${lxr.name} = refqll1.${lr.as}`)}
      `);
    }, sqlX<RefQLRows>``);

    const { tag: l2, next } = this.tag.interpret (l2Join.concat (l2where));

    const joined = sqlX`
      select * from (${l1}) refqll1,
      lateral (${l2}) refqll2
    `;

    this.tag.interpreted = { tag: joined, next };

    return this.tag;

  } else {
    const { rRef, lRef, parent } = this.info;

    const l1 = lRef.reduce ((acc, lr, idx) => {
      const kw = idx === 0 ? "where" : "and";

      return acc.concat (sqlX<RefQLRows>`
        ${Raw (`${kw} ${lr.name}`)}
        in ${Values (p => [...new Set (p.refQLRows.map (r => r[lr.as]))])}
      `);
    }, sqlX<RefQLRows>`
      select distinct ${Raw (lRef.join (", "))}
      from ${Raw (parent)}
    `);

    const { tag: l2, next } = this.tag.interpret (lRef.reduce ((acc, lr, idx) => {
      const rr = rRef[idx];
      const kw = idx === 0 ? "where" : "and";

      return acc.concat (sqlX<RefQLRows>`
        ${Raw (`${kw} ${rr.name} = refqll1.${lr.as}`)}
      `);
    }, sqlX<RefQLRows>``));

    const joined = sqlX`
      select * from (${l1}) refqll1,
      lateral (${l2}) refqll2
    `;

    this.tag.interpreted = { tag: joined, next };

    return this.tag;
  }
}

RefNode.isRefNode = function (x: any): x is RefNode {
  return x != null && x[refqlType] === type;
};

export default RefNode;