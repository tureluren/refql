import copyObj from "../common/copyObj.ts";
import truePred from "../common/truePred.ts";
import { TagFunctionVariable } from "../common/types.ts";

const SQLNodeSymbol: unique symbol = Symbol ("@@SQLNode");

interface SQLNode<Params> {
  params: Params;
  run: TagFunctionVariable<Params, any>;
  setPred (fn: TagFunctionVariable<Params, boolean>): SQLNode<Params>;
  pred: TagFunctionVariable<Params, boolean>;
  [SQLNodeSymbol]: true;
}

export const sqlNodePrototype = {
  [SQLNodeSymbol]: true,
  setPred,
  pred: truePred
};

function setPred<Params>(this: SQLNode<Params>, fn: TagFunctionVariable<Params, boolean>) {
  let sqlNode = copyObj (this);

  sqlNode.pred = fn;

  return sqlNode;
}

export const isSQLNode = function <Params = any> (x: any): x is SQLNode<Params> {
  return x != null && !!x[SQLNodeSymbol];
};

export default SQLNode;