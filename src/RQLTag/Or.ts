import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import Prop from "../Prop";
import SQLProp from "../Prop/SQLProp";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlP, sqlX } from "../SQLTag/sql";
import Operation, { operationPrototype } from "./Operation";
import OrderBy from "./OrderBy";
import rawSpace from "./RawSpace";

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
function Or<TableId extends string, Params>(prop: Prop<TableId> | SQLProp, pred?: TagFunctionVariable<Params, boolean>) {
  let or: Or<TableId, Params> = Object.create (prototype);

  if (pred) {
    or.pred = pred;
  }

  or.prop = prop;

  return or;
}

function interpret(this: Or, col: Raw | SQLTag) {
  const { pred, prop } = this;
  let filters = sqlX``;

  for (const op of prop.operations) {
    if (OrderBy.isOrderBy (op)) {
      // throw error, no order by allowed hier
    } else {
      const delimiter = rawSpace (op.pred);

      filters = filters.join (
        delimiter,
        op.interpret (col)
      );
    }
  }

  return sqlP (pred)`
    or (${filters})
  `;
}



Or.isOr = function <TableId extends string = any, Params = any> (x: any): x is Or<TableId, Params> {
  return x != null && x[refqlType] === type;
};

export default Or;