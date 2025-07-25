import { RQLTag } from ".";
import { refqlType } from "../common/consts";
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

export interface DeleteRQLTag<TableId extends string = any, Params = any, Output = any> extends CUD<TableId, Params, Output> {
  nodes: RQLNode[];
}

const type = "refql/DeleteRQLTag";

let prototype = Object.assign ({}, CUDPrototype, {
  constructor: createDeleteRQLTag,
  [refqlType]: type,
  interpret
});

export function createDeleteRQLTag<TableId extends string, Params = {}, Output = any>(table: Table<TableId>, nodes: RQLNode[], options: RequiredRefQLOptions) {
  const tag = ((params: Params) => {
    return options.runner (tag, params);
  }) as DeleteRQLTag<TableId, Params, Output>;

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

function interpret(this: DeleteRQLTag): InterpretedCUD {
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
    } else if (isSQLTag (node)) {
      filters = filters.join (" ", node);
    } else {
      throw new Error (`Unknown Deletable RQLNode Type: "${String (node)}"`);
    }
  }

  const props = getStandardProps (table);

  const deleteTable = sqlX`
    delete from ${Raw (table)}
    where 1 = 1
  `;

  let tag = deleteTable
    .join ("", filters)
    .concat (sqlX`
      returning ${Raw (`${props.map (p => `${table.name}.${p.col || p.as} "${p.as}"`).join (", ")}`)}
    `);

  return {
    tag,
    returning
  };
}

export const isDeleteRQLTag = function <As extends string = any, Params = any, Output = any> (x: any): x is DeleteRQLTag<As, Params, Output> {
  return x != null && x[refqlType] === type;
};