import { refqlType } from "../common/consts";
import { LogicOperator } from "../common/types";
import Prop from "../Prop";
import SQLProp from "../Prop/SQLProp";
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

function Logic<TableId extends string, Params>(prop: Prop<TableId> | SQLProp, operator: LogicOperator) {
  let logic: Logic<TableId, Params> = Object.create (prototype);

  if (prop.operations.length === 0) {
    throw new Error ("Prop without operations passed");
  }

  logic.prop = prop;

  logic.operator = operator;

  return logic;
}

function interpret(this: Logic) {
  const { prop, operator } = this;
  let filters = sqlX``;

  prop.operations.forEach ((op, idx) => {
    if (OrderBy.isOrderBy (op)) {
      throw new Error ("No OrderBy operation allowed here");
    } else {
      const propCol = prop.interpret ();

      filters = filters.join (
        idx > 0 ? " " : "",
        op.interpret (propCol, idx > 0)
      );
    }
  });

  return sqlX`
    ${Raw (operator)} (${filters})
  `;
}

Logic.isLogic = function <TableId extends string = any, Params = any> (x: any): x is Logic<TableId, Params> {
  return x != null && x[refqlType] === type;
};

export default Logic;