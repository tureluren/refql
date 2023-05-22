import { refqlType } from "../common/consts.ts";
import { SQLTag } from "../SQLTag/index.ts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface OrderBy<Prop extends SQLTag | string = any, Descending extends boolean = false, Params = any> extends RQLNode, SelectableType {
  params: Params;
  prop: Prop;
  descending: Descending;
}

const type = "refql/OrderBy";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: OrderBy,
  [refqlType]: type
});

function OrderBy<Prop extends SQLTag | string, Descending extends boolean, Params = any>(prop: Prop, descending: Descending) {
  let orderBy: OrderBy<Prop, Descending> = Object.create (prototype);

  orderBy.prop = prop;
  orderBy.descending = descending;

  return orderBy;
}

OrderBy.isOrderBy = function <Prop extends SQLTag | string = any, Descending extends boolean = false, Params = any> (x: any): x is OrderBy<Prop, Descending, Params> {
  return x != null && x[refqlType] === type;
};

export default OrderBy;