import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlP } from "../SQLTag/sql";
import Operation, { operationPrototype } from "../Table/Operation";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface OrderBy<Params = any> extends RQLNode, Operation<Params> {
  descending: boolean;
}

const type = "refql/OrderBy";

const prototype = Object.assign ({}, rqlNodePrototype, operationPrototype, {
  constructor: OrderBy,
  [refqlType]: type,
  precedence: 2,
  interpret
});

function OrderBy<Params = any>(descending: boolean = false, pred?: TagFunctionVariable<Params, boolean>) {
  let orderBy: OrderBy<Params> = Object.create (prototype);

  orderBy.descending = descending;

  if (pred) {
    orderBy.pred = pred;
  }

  return orderBy;
}

function interpret(this: OrderBy, col: Raw | SQLTag, isEmpty?: boolean) {
  const { descending, pred } = this;
  const dir = descending ? "desc" : "asc";

  return sqlP (pred)`
    ${Raw (isEmpty ? "order by" : ",")} ${col} ${Raw (dir)}
  `;
}

OrderBy.isOrderBy = function <Params = any> (x: any): x is OrderBy<Params> {
  return x != null && x[refqlType] === type;
};

export default OrderBy;