import { refqlType } from "../common/consts";
import { InterpretedString, TagFunctionVariable } from "../common/types";
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
  precedence: 2,
  interpret
});

function OrderBy<Params = any>(descending: boolean = false) {
  let orderBy: OrderBy<Params> = Object.create (prototype);

  orderBy.descending = descending;

  return orderBy;
}

function interpret <Params = any>(this: OrderBy, pred: TagFunctionVariable<Params, boolean>) {
  const { descending } = this;

  const beginning: InterpretedString<Params> = { pred, run: () => [", ", 0] };

  const ending: InterpretedString<Params> = { pred, run: () => [` ${descending ? "desc" : "asc"}`, 0] };

  return [beginning, ending];
}

OrderBy.isOrderBy = function <Params = any> (x: any): x is OrderBy<Params> {
  return x != null && x[refqlType] === type;
};

export default OrderBy;