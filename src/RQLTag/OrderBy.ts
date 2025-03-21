import { refqlType } from "../common/consts";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import Operation, { operationPrototype } from "./Operation";

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

// hard to make pred work for orderby because of 'order by' keyword placement.
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