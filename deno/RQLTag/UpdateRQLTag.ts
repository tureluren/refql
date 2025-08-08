import { isRQLTag, RQLTag } from "./index.ts";
import { refqlType } from "../common/consts.ts";
import isFirstKey from "../common/isFirstKey.ts";
import RQLEmpty from "../common/RQLEmpty.ts";
import { InterpretedCUD, RequiredRefQLOptions } from "../common/types.ts";
import Prop from "../Prop/index.ts";
import SQLProp from "../Prop/SQLProp.ts";
import { isSQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import { sqlX } from "../SQLTag/sql.ts";
import { Table } from "../Table/index.ts";
import CUD, { CUDPrototype } from "./CUD.ts";
import getStandardProps from "./getStandardProps.ts";
import RQLNode from "./RQLNode.ts";

export interface UpdateRQLTag<TableId extends string = any, Params = any, Output = any> extends CUD<TableId, Params, Output> {
  nodes: RQLNode[];
}

const type = "refql/UpdateRQLTag";

let prototype = Object.assign ({}, CUDPrototype, {
  constructor: createUpdateRQLTag,
  [refqlType]: type,
  interpret
});

export function createUpdateRQLTag(table: Table, nodes: RQLNode[], options: RequiredRefQLOptions) {
  const tag = ((params: any) => {
    return options.runner (tag, params);
  }) as UpdateRQLTag;

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
      const col = node.interpret ();

      for (const op of node.operations) {
        filters = filters.join (
          " ",
          op.interpret (col, true)
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
      const pred = (params: { data: any[]}) => params.data[field.as] !== undefined;

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

export const isUpdateRQLTag = function (x: any): x is UpdateRQLTag {
  return x != null && x[refqlType] === type;
};