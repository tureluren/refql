import { refqlType } from "../common/consts";
import { SQLTag } from "../SQLTag";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface OrderBy<Prop extends SQLTag | string = any, Descending extends boolean = false> extends RQLNode, SelectableType {
  prop: Prop;
  descending: Descending;
}

const type = "refql/OrderBy";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: OrderBy,
  [refqlType]: type
});

function OrderBy<Prop extends SQLTag | string, Descending extends boolean>(prop: Prop, descending: Descending) {
  let orderBy: OrderBy<Prop, Descending> = Object.create (prototype);

  orderBy.prop = prop;
  orderBy.descending = descending;

  return orderBy;
}

OrderBy.isOrderBy = function <Prop extends SQLTag | string = any, Descending extends boolean = false> (x: any): x is OrderBy<Prop, Descending> {
  return x != null && x[refqlType] === type;
};

export default OrderBy;