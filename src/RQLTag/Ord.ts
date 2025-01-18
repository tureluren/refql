import { refqlType } from "../common/consts";
import { OrdOperator, TagFunctionVariable } from "../common/types";
import Operation from "../Table/Operation";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface Ord<Params = any, Type = any> extends RQLNode, Operation<Params> {
  params: Params;
  run: TagFunctionVariable<Params, Type>;
  operator: OrdOperator;
}

const type = "refql/Ord";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Ord,
  [refqlType]: type,
  precedence: 1
});

function Ord<Params, Type>(run: TagFunctionVariable<Params, Type> | Type, operator: OrdOperator) {
  let ord: Ord<Params, Type> = Object.create (prototype);


  ord.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type>;

  ord.operator = operator;

  return ord;
}

Ord.isOrd = function <Params = any, Type = any> (x: any): x is Ord<Params, Type> {
  return x != null && x[refqlType] === type;
};

export default Ord;