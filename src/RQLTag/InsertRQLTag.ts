import { isRQLTag, RQLTag } from ".";
import { refqlType } from "../common/consts";
import { InterpretedCUD, Querier, Runner } from "../common/types";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import Values2D from "../SQLTag/Values2D";
import { Table } from "../Table";
import CUD, { CUDPrototype } from "./CUD";
import getStandardProps from "./getStandardProps";
import RQLNode from "./RQLNode";
import runnableTag from "./runnableTag";

export interface InsertRQLTag<TableId extends string = any, Params = any, Output = any> extends CUD<TableId, Params, Output> {
  nodes: RQLNode[];
}

const type = "refql/InsertRQLTag";

let prototype = Object.assign ({}, CUDPrototype, {
  constructor: createInsertRQLTag,
  [refqlType]: type,
  interpret
});

export function createInsertRQLTag<TableId extends string, Params = {}, Output = any>(table: Table<TableId>, nodes: RQLNode[], querier: Querier, runner: Runner) {
  const tag = runnableTag<InsertRQLTag<TableId, Params, Output>> ();

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes,
      querier,
      runner
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

  let tag = sqlX`
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