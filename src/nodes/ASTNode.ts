import { Boxes } from "../common/BoxRegistry";
import { TagFunctionVariable, ValueType, RefInfo, RefQLRows } from "../common/types";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";

export type StructureMap<Params, Output, Box extends Boxes, Return> = {
  Raw: (run: TagFunctionVariable<Params, Box, string>) => Return;
  Value: (run: TagFunctionVariable<Params, Box>) => Return;
  Values: (run: TagFunctionVariable<Params, Box, any[]>) => Return;
  Values2D: (run: TagFunctionVariable<Params, Box, any[][]>) => Return;
  When: (pred: TagFunctionVariable<Params, Box, boolean>, tag: SQLTag<Params, Output, Box>) => Return;
};

interface ASTNode<Params, Output, Box extends Boxes> {
  caseOf<Return>(structureMap: StructureMap<Params, Output, Box, Return>): Return;
}

const astNode: symbol = Symbol ("@@ASTNode");

export const astNodePrototype = {
  [astNode]: true
};

export const isASTNode = function<Params, Output, Box extends Boxes> (x: any): x is ASTNode<Params, Output, Box> {
  return x != null && !!x[astNode];
};

export default ASTNode;