import { isRQLTag, RQLTag } from ".";
import { refqlType } from "../common/consts";
import isFirstKey from "../common/isFirstKey";
import RQLEmpty from "../common/RQLEmpty";
import { InterpretedCUD, RequiredRefQLOptions } from "../common/types";
import Prop from "../Prop";
import SQLProp from "../Prop/SQLProp";
import { isSQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import { Table } from "../Table";
import CUD, { CUDPrototype } from "./CUD";
import getStandardProps from "./getStandardProps";
import RQLNode from "./RQLNode";

export interface UpdateRQLTag<TableId extends string = any, Params = any, Output = any> extends CUD<TableId, Params, Output> {
  nodes: RQLNode[];
}

const type = "refql/UpdateRQLTag";

let prototype = Object.assign ({}, CUDPrototype, {
  constructor: createUpdateRQLTag,
  [refqlType]: type,
  interpret
});

export function createUpdateRQLTag<TableId extends string, Params = {}, Output = any>(table: Table<TableId>, nodes: RQLNode[], options: RequiredRefQLOptions) {
  const tag = ((params: Params) => {
    return options.runner (tag, params);
  }) as UpdateRQLTag<TableId, Params, Output>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes,
      options
    })
  );

  return tag;
}

function interpret(this: UpdateRQLTag): InterpretedCUD {
  const { nodes, table } = this;

  let filters = sqlX``;
  let returning: RQLTag | undefined;

  for (const node of nodes) {
    if (Prop.isProp (node) || SQLProp.isSQLProp (node)) {
      const col = isSQLTag (node.col)
        ? sqlX`(${node.col})`
        : Raw (`${table.name}.${node.col || node.as}`);

      for (const op of node.operations) {
        filters = filters.join (
          " ",
          op.interpret (col)
        );
      }
    } else if (isRQLTag (node)) {
      returning = returning ? returning.concat (node) : node;
    } else if (isSQLTag (node)) {
      filters = filters.join (" ", node);
    } else {
      throw new Error (`Unknown Updatable RQLNode Type: "${String (node)}"`);
    }
  }

  const props = getStandardProps (table);

  const sortedProps = props.sort ((a, b) => a.as.localeCompare (b.as));

  const updateTable = sqlX`
    update ${Raw (table)} set
  `;

  const updateFields = sortedProps
    .reduce ((t, field) => {
      const pred = (params: { data: any[]}) => params.data[field.as] != null;

      return t.join ("", sqlX`
        ${Raw ((p: any) => pred (p) ? `${isFirstKey (p.data, field.as) ? "" : ","} ${field.col || field.as} = ` : "")}${(p: any) => pred (p) ? p.data[field.as] : RQLEmpty} 
      ` as any);
    }, updateTable);

  let tag = updateFields
    .concat (sqlX`where 1 = 1`)
    .join ("", filters)
    .concat (sqlX`
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