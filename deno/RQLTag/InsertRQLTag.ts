import { isRQLTag, RQLTag } from "./index.ts";
import { refqlType } from "../common/consts.ts";
import { InterpretedCUD } from "../common/types.ts";
import Raw from "../SQLTag/Raw.ts";
import sql from "../SQLTag/sql.ts";
import Values2D from "../SQLTag/Values2D.ts";
import Table from "../Table/index.ts";
import CUD, { CUDPrototype } from "./CUD.ts";
import getStandardProps from "./getStandardProps.ts";
import RQLNode from "./RQLNode.ts";
import runnableTag from "./runnableTag.ts";

export interface InsertRQLTag<TableId extends string = any, Params = any, Output = any> extends CUD<TableId, Params, Output> {
  nodes: RQLNode[];
}

const type = "refql/InsertRQLTag";

let prototype = Object.assign ({}, CUDPrototype, {
  constructor: createInsertRQLTag,
  [refqlType]: type,
  interpret
});

export function createInsertRQLTag<TableId extends string, Params = {}, Output = any>(table: Table<TableId>, nodes: RQLNode[]) {
  const tag = runnableTag<InsertRQLTag<TableId, Params, Output>> ();

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes
    })
  );

  return tag;
}

function interpret(this: InsertRQLTag): InterpretedCUD {
  const { nodes, table } = this;
  let returning: RQLTag | undefined;

  for (const node of nodes) {
    if (isRQLTag (node)) {
      returning = returning ? returning.concat (node) : node;
    } else {
      throw new Error (`Unknown Insertable RQLNode Type: "${String (node)}"`);
    }
  }

  const props = getStandardProps (table);

  let tag = sql`
    insert into ${Raw (`${table} (${props.map (f => f.col || f.as).join (", ")})`)}
    values ${Values2D ((params: { data: any[]}) => params.data.map (x => props.map (f => x[f.as] == null ? Raw ("DEFAULT") : x[f.as])))}
    returning ${Raw (`${props.map (p => `${table.name}.${p.col || p.as} "${p.as}"`).join (", ")}`)}
  `;

  return {
    tag,
    returning
  };
}

export const isInsertRQLTag = function <As extends string = any, Params = any, Output = any> (x: any): x is InsertRQLTag<As, Params, Output> {
  return x != null && x[refqlType] === type;
};