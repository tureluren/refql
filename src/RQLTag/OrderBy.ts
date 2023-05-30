import { refqlType } from "../common/consts";
import { SQLTag } from "../SQLTag";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface OrderBy<Prop extends SQLTag | string = any, Params = any> extends RQLNode, SelectableType {
  params: Params;
  prop: Prop;
  descending: boolean;
  setPred (fn: (p: any) => boolean): OrderBy<Prop, Params>;
}

const type = "refql/OrderBy";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: OrderBy,
  [refqlType]: type,
  setPred,
  precedence: 2
});

function OrderBy<Prop extends SQLTag | string, Params = any>(prop: Prop, descending: boolean = false) {
  let orderBy: OrderBy<Prop, Params> = Object.create (prototype);

  orderBy.prop = prop;
  orderBy.descending = descending;

  return orderBy;
}

function setPred(this: OrderBy, fn: (p: any) => boolean) {
  let orderBy = OrderBy (this.prop, this.descending);

  orderBy.pred = fn;

  return orderBy;
}

OrderBy.isOrderBy = function <Prop extends SQLTag | string = any, Params = any> (x: any): x is OrderBy<Prop, Params> {
  return x != null && x[refqlType] === type;
};

export default OrderBy;