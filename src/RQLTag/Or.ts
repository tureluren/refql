import { refqlType } from "../common/consts";
import Prop from "../Prop";
import SQLProp from "../Prop/SQLProp";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import Operation, { operationPrototype } from "./Operation";
import OrderBy from "./OrderBy";

interface Or<TableId extends string = any, Params = any> extends Operation<Params> {
  prop: Prop<TableId> | SQLProp;
}

const type = "refql/Or";

const prototype = Object.assign ({}, operationPrototype, {
  constructor: Or,
  [refqlType]: type,
  interpret
});

// prop moet minstens 1 op hebben en parent ook
function Or<TableId extends string, Params>(prop: Prop<TableId> | SQLProp) {
  let or: Or<TableId, Params> = Object.create (prototype);

  or.prop = prop;

  return or;
}

function interpret(this: Or, col: Raw | SQLTag) {
  const { prop } = this;
  let filters = sqlX``;

  for (const op of prop.operations) {
    if (OrderBy.isOrderBy (op)) {
      // throw error, no order by allowed hier
    } else {
      filters = filters.join (
        " ",
        op.interpret (col)
      );
    }
  }

  return sqlX`
    or (${filters})
  `;
}



Or.isOr = function <TableId extends string = any, Params = any> (x: any): x is Or<TableId, Params> {
  return x != null && x[refqlType] === type;
};

export default Or;