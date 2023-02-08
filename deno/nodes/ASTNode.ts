import { TagFunctionVariable, ValueType, RefInfo, RefQLRows } from "../common/types.ts";
import RQLTag from "../RQLTag/index.ts";
import SQLTag from "../SQLTag/index.ts";

export type StructureMap<Params, Output, Return> = {
  RefNode: (tag: RQLTag<Params & RefQLRows, Output>, info: RefInfo, single: boolean) => Return;
  BelongsToMany: (tag: RQLTag<Params & RefQLRows, Output>, info: Required<RefInfo>, single: boolean) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (x: SQLTag<Params, Output> | ValueType, as?: string, cast?: string) => Return;
  Call: (tag: SQLTag<Params, Output>, name: string, as?: string, cast?: string) => Return;
  Literal: (x: string | number | boolean | null, as?: string, cast?: string) => Return;
  StringLiteral: (x: string, as?: string, cast?: string) => Return;
  Raw: (run: TagFunctionVariable<Params, string>) => Return;
  Value: (run: TagFunctionVariable<Params>) => Return;
  Values: (run: TagFunctionVariable<Params, any[]>) => Return;
  Values2D: (run: TagFunctionVariable<Params, any[][]>) => Return;
  When: (pred: TagFunctionVariable<Params, boolean>, tag: SQLTag<Params, Output>) => Return;
};

interface ASTNode<Params = unknown, Output = unknown> {
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