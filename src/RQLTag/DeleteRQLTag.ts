import { isRQLTag, RQLTag } from ".";
import { refqlType } from "../common/consts";
import isLastKey from "../common/isLastKey";
import { InterpretedCUD } from "../common/types";
import Prop from "../Prop";
import { isSQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import sql, { sqlP } from "../SQLTag/sql";
import Table from "../Table";
import CUD, { CUDPrototype } from "./CUD";
import getStandardProps from "./getStandardProps";
import rawSpace from "./RawSpace";
import runnableTag from "./runnableTag";

export interface DeleteRQLTag<TableId extends string = any, Params = any, Output = any> extends CUD<TableId, Params, Output> {
  nodes: Prop[];
}

const type = "refql/DeleteRQLTag";

let prototype = Object.assign ({}, CUDPrototype, {
  constructor: createDeleteRQLTag,
  [refqlType]: type,
  interpret
});

export function createDeleteRQLTag<TableId extends string, Params = {}, Output = any>(table: Table<TableId>, nodes: (Prop | RQLTag<TableId>)[]) {
  const tag = runnableTag<DeleteRQLTag<TableId, Params, Output>> ();

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      table,
      nodes
    })
  );

  return tag;
}

function interpret(this: DeleteRQLTag): InterpretedCUD {
  const { nodes, table } = this;

  let filters = sql``;
  let returning = table ([]);

  for (const node of nodes) {
    if (Prop.isProp (node)) {
      const col = isSQLTag (node.col)
        ? sql`(${node.col})`
        : Raw (`${table.name}.${node.col || node.as}`);

      for (const op of node.operations) {
        const delimiter = rawSpace (op.pred);

        filters = filters.join (
          delimiter,
          op.interpret (col)
        );
      }
    } else {
      throw new Error (`Not a Prop or RQLTag Type: "${String (node)}"`);
    }
  }

  const props = getStandardProps (table);

  const deleteTable = sql`
    delete from ${Raw (table)}
    where 1 = 1
  `;

  let tag = deleteTable
    .join ("", filters)
    .concat (sql`
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