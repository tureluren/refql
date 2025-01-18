import { refqlType } from "../common/consts";
import Operation from "../Table/Operation";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface OrderBy<Params = any> extends RQLNode, Operation<Params> {
  params: Params;
  descending: boolean;
}

const type = "refql/OrderBy";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: OrderBy,
  [refqlType]: type,
  precedence: 2
});

function OrderBy<Params = any>(descending: boolean = false) {
  let orderBy: OrderBy<Params> = Object.create (prototype);

  orderBy.descending = descending;

  return orderBy;
}

OrderBy.isOrderBy = function <Params = any> (x: any): x is OrderBy<Params> {
  return x != null && x[refqlType] === type;
};

export default OrderBy;