import { isRQLTag, RQLTag } from ".";
import { refqlType } from "../common/consts";
import { InterpretedCUD } from "../common/types";
import Prop from "../Prop";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import Table from "../Table";
import CUD, { CUDPrototype } from "./CUD";
import getStandardProps from "./getStandardProps";
import runnableTag from "./runnableTag";

export interface UpdateRQLTag<TableId extends string = any, Params = any, Output = any> extends CUD<TableId, Params, Output> {
  nodes: (Prop | RQLTag<TableId>)[];
}

const type = "refql/UpdateRQLTag";

let prototype = Object.assign ({}, CUDPrototype, {
  constructor: createUpdateRQLTag,
  [refqlType]: type,
  interpret
});

export function createUpdateRQLTag<TableId extends string, Params = {}, Output = any>(table: Table<TableId>, nodes: (Prop | RQLTag<TableId>)[]) {
  const tag = runnableTag<UpdateRQLTag<TableId, Params, Output>> ();

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes
    })
  );

  return tag;
}

function interpret(this: UpdateRQLTag): InterpretedCUD {
  const { nodes, table } = this,
    members = [] as Prop[];

  let returning = table ([]);

  for (const node of nodes) {
    if (Prop.isProp (node)) {
      members.push (node);
    } else if (isRQLTag (node)) {
      returning = returning.concat (node);
    } else {
      throw new Error (`Not a Prop or RQLTag Type: "${String (node)}"`);
    }
  }

  const props = getStandardProps (table);

  const updateTable = sql`
    update ${Raw (table)} set
  `;

  const updateFields = members
    .reduce ((t, field) => t.concat (sql`
        ${Raw (field.col || field.as)} = ${(p: any) => p[field.as]}, 
      `)
    , updateTable);

  let tag = updateFields.concat (sql`
    returning ${Raw (`${props.map (p => `${table.name}.${p.col || p.as} "${p.as}"`).join (", ")}`)}
  `);

  return {
    tag,
    returning
  };
}

export const isUpdateRQLTag = function <As extends string = any, Params = any, Output = any> (x: any): x is UpdateRQLTag<As, Params, Output> {
  return x != null && x[refqlType] === type;
};