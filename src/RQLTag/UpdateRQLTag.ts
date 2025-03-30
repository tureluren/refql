import { isRQLTag, RQLTag } from ".";
import { refqlType } from "../common/consts";
import isLastKey from "../common/isLastKey";
import { InterpretedCUD, Querier, Runner } from "../common/types";
import Prop from "../Prop";
import SQLProp from "../Prop/SQLProp";
import { isSQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlP, sqlX } from "../SQLTag/sql";
import { Table } from "../Table";
import CUD, { CUDPrototype } from "./CUD";
import getStandardProps from "./getStandardProps";
import rawSpace from "./RawSpace";
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

export function createUpdateRQLTag<TableId extends string, Params = {}, Output = any>(table: Table<TableId>, nodes: RQLNode[], querier: Querier, runner: Runner) {
  const tag = ((params: Params) => {
    return runner (tag, params);
  }) as UpdateRQLTag<TableId, Params, Output>;

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
        const delimiter = rawSpace (op.pred);

        filters = filters.join (
          delimiter,
          op.interpret (col)
        );
      }
    } else if (isRQLTag (node)) {
      returning = returning ? returning.concat (node) : node;
    } else if (isSQLTag (node)) {
      filters = filters.join (rawSpace (), node);
    } else {
      throw new Error (`Unknown Updatable RQLNode Type: "${String (node)}"`);
    }
  }

  const props = getStandardProps (table);

  const updateTable = sqlX`
    update ${Raw (table)} set
  `;

  const updateFields = props
    .reduce ((t, field) => {
      const pred = (params: { data: any[]}) => params.data[field.as] != null;

      return t.join (rawSpace (pred), sqlP (pred)`
        ${Raw (field.col || field.as)} = ${(p: any) => p.data[field.as]}${Raw (p => isLastKey (p.data, field.as) ? "" : ",")} 
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