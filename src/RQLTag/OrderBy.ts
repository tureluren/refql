import { refqlType } from "../common/consts";
import { SQLTag } from "../SQLTag";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface OrderBy<Prop extends SQLTag | string = any, Descending extends boolean = false, Params = any> extends RQLNode, SelectableType {
  params: Params;
  prop: Prop;
  descending: Descending;
  setPred (fn: (p: any) => boolean): OrderBy<Prop, Descending, Params>;
}

const type = "refql/OrderBy";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: OrderBy,
  [refqlType]: type,
  setPred,
  precedence: 2
});

function OrderBy<Prop extends SQLTag | string, Descending extends boolean, Params = any>(prop: Prop, descending: Descending) {
  let orderBy: OrderBy<Prop, Descending> = Object.create (prototype);

  orderBy.prop = prop;
  orderBy.descending = descending;

  return orderBy;
}

function setPred(this: OrderBy, fn: (p: any) => boolean) {
  let orderBy = OrderBy (this.prop, this.descending);

  orderBy.pred = fn;

  return orderBy;
}

OrderBy.isOrderBy = function <Prop extends SQLTag | string = any, Descending extends boolean = false, Params = any> (x: any): x is OrderBy<Prop, Descending, Params> {
  return x != null && x[refqlType] === type;
};

export default OrderBy;