const RQLNodeSymbol: unique symbol = Symbol ("@@RQLNode");

export interface RQLNode {
  [RQLNodeSymbol]: true;
}

export const rqlNodePrototype = {
  [RQLNodeSymbol]: true
};

export const isRQLNode = function (x: any): x is RQLNode {
  return x != null && !!x[RQLNodeSymbol];
};