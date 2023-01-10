import { TagFunctionVariable, ValueType, RefInfo } from "../common/types.ts";
import RQLTag from "../RQLTag/index.ts";
import SQLTag from "../SQLTag/index.ts";

type StructureMap<Params, Return> = {
  RefNode: (tag: RQLTag<Params>, info: RefInfo, single: boolean) => Return;
  BelongsToMany: (tag: RQLTag<Params>, info: Required<RefInfo>, single: boolean) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (x: SQLTag<Params> | ValueType, as?: string, cast?: string) => Return;
  Call: (tag: SQLTag<Params>, name: string, as?: string, cast?: string) => Return;
  Literal: (x: string | number | boolean | null, as?: string, cast?: string) => Return;
  StringLiteral: (x: string, as?: string, cast?: string) => Return;
  Raw: (run: TagFunctionVariable<Params, string>) => Return;
  Value: (run: TagFunctionVariable<Params>) => Return;
  Values: (run: TagFunctionVariable<Params, any[]>) => Return;
  Values2D: (run: TagFunctionVariable<Params, any[][]>) => Return;
  When: (pred: TagFunctionVariable<Params, boolean>, tag: SQLTag<Params>) => Return;
};

interface ASTNode<Params> {
  caseOf<Return>(structureMap: StructureMap<Params, Return>): Return;
}

const astNode: symbol = Symbol ("@@ASTNode");

export const astNodePrototype = {
  [astNode]: true
};

export const isASTNode = function <Params> (x: any): x is ASTNode<Params> {
  return x != null && !!x[astNode];
};

export default ASTNode;