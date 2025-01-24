import truePred from "../common/truePred";
import { TagFunctionVariable } from "../common/types";

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
  const SQLNodeCls = (this as any).__proto__.constructor;
  const sqlNode = new SQLNodeCls (this.run);

  sqlNode.pred = fn;

  return sqlNode;
}

export const isSQLNode = function <Params = any> (x: any): x is SQLNode<Params> {
  return x != null && !!x[SQLNodeSymbol];
};

export default SQLNode;