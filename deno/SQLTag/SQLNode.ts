const SQLNodeSymbol: unique symbol = Symbol ("@@SQLNode");

interface SQLNode<Params> {
  params: Params;
  [SQLNodeSymbol]: true;
}

export const sqlNodePrototype = {
  [SQLNodeSymbol]: true
};

export const isSQLNode = function <Params = any> (x: any): x is SQLNode<Params> {
  return x != null && !!x[SQLNodeSymbol];
};

export default SQLNode;