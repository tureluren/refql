import { refqlType } from "../common/consts.ts";
import { SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import { sqlX } from "../SQLTag/sql.ts";
import Operation, { operationPrototype } from "./Operation.ts";

interface OrderBy<Params = any> extends Operation<Params> {
  descending: boolean;
}

const type = "refql/OrderBy";

const prototype = Object.assign ({}, operationPrototype, {
  constructor: OrderBy,
  [refqlType]: type,
  interpret
});

function OrderBy<Params = any>(descending: boolean = false) {
  let orderBy: OrderBy<Params> = Object.create (prototype);

  orderBy.descending = descending;

  return orderBy;
}

function interpret(this: OrderBy, col: Raw | SQLTag) {
  const { descending } = this;
  const dir = descending ? "desc" : "asc";

  return sqlX`
    ${col} ${Raw (dir)}
  `;
}

OrderBy.isOrderBy = function <Params = any> (x: any): x is OrderBy<Params> {
  return x != null && x[refqlType] === type;
};

export default OrderBy;