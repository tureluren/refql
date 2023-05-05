import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";

export type StructureMap<Params, Output, Return> = {
  Raw: (run: TagFunctionVariable<Params, string>) => Return;
  Value: (run: TagFunctionVariable<Params>) => Return;
  Values: (run: TagFunctionVariable<Params, any[]>) => Return;
  Values2D: (run: TagFunctionVariable<Params, any[][]>) => Return;
  When: (pred: TagFunctionVariable<Params, boolean>, tag: SQLTag<Params, Output>) => Return;
};

// Rename to SQLNode ?
interface ASTNode<Params, Output> {
  caseOf<Return>(structureMap: StructureMap<Params, Output, Return>): Return;
}

const astNode: symbol = Symbol ("@@ASTNode");

export const astNodePrototype = {
  [astNode]: true
};

export const isASTNode = function<Params, Output> (x: any): x is ASTNode<Params, Output> {
  return x != null && !!x[astNode];
};

export default ASTNode;