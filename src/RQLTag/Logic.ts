import { refqlType } from "../common/consts";
import { LogicOperator } from "../common/types";
import Prop from "../Prop";
import SQLProp from "../Prop/SQLProp";
import { isSQLTag, SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import Operation, { operationPrototype } from "./Operation";
import OrderBy from "./OrderBy";

interface Logic<TableId extends string = any, Params = any> extends Operation<Params> {
  prop: Prop<TableId> | SQLProp;
  operator: LogicOperator;
}

const type = "refql/Logic";

const prototype = Object.assign ({}, operationPrototype, {
  constructor: Logic,
  [refqlType]: type,
  interpret
});

// prop moet minstens 1 op hebben en parent ook
function Logic<TableId extends string, Params>(prop: Prop<TableId> | SQLProp, operator: LogicOperator) {
  let logic: Logic<TableId, Params> = Object.create (prototype);

  logic.prop = prop;

  logic.operator = operator;

  return logic;
}

function interpret(this: Logic, col: Raw | SQLTag, displayAnd: true, tableName: string) {
  const { prop, operator } = this;
  let filters = sqlX``;

  prop.operations.forEach ((op, idx) => {
    if (OrderBy.isOrderBy (op)) {
      // throw error, no order by allowed hier
      // throw ook error als prop niet van dezelfde table is indien mogelijk
    } else {
      const propCol = isSQLTag (prop.col)
        ? sqlX`(${prop.col})`
        : Raw (`${tableName}.${prop.col || prop.as}`);

      filters = filters.join (
        idx > 0 ? " " : "",
        op.interpret (propCol, idx > 0, tableName)
      );
    }
  });

  if (prop.operations.length > 1) {
    return sqlX`
      ${Raw (operator)} (${filters})
    `;
  }

  return sqlX`
    ${Raw (operator)} ${filters}
  `;

}

Logic.isOr = function <TableId extends string = any, Params = any> (x: any): x is Logic<TableId, Params> {
  return x != null && x[refqlType] === type;
};

export default Logic;