import { refqlType } from "../common/consts";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import Operation, { operationPrototype } from "./Operation";

interface OrderBy<Params = any> extends Operation<Params> {
  descending: boolean;
  nullsFirst: boolean;
  nullsLast: boolean;
}

const type = "refql/OrderBy";

const prototype = Object.assign ({}, operationPrototype, {
  constructor: OrderBy,
  [refqlType]: type,
  interpret
});

function OrderBy<Params = any>(descending: boolean = false, nullsFirst: boolean = false, nullsLast: boolean = false): OrderBy<Params> {
  let orderBy: OrderBy<Params> = Object.create (prototype);

  orderBy.descending = descending;
  orderBy.nullsFirst = nullsFirst;
  orderBy.nullsLast = nullsLast;

  return orderBy;
}

function interpret(this: OrderBy, col: Raw | SQLTag) {
  const { descending, nullsFirst, nullsLast } = this;
  let dir = descending ? "desc" : "asc";

  if (nullsFirst) {
    dir += " nulls first";
  } else if (nullsLast) {
    dir += " nulls last";
  }

  return sqlX`
    ${col} ${Raw (dir)}
  `;
}

OrderBy.isOrderBy = function (x: any): x is OrderBy {
  return x != null && x[refqlType] === type;
};

export default OrderBy;