import { TagFunctionVariable, ValueType, RefInfo } from "../common/types";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";

type StructureMap<Params, Return> = {
  RefNode: (tag: RQLTag<Params>, info: RefInfo, single: boolean) => Return;
  BelongsToMany: (tag: RQLTag<Params>, info: Required<RefInfo>, single: boolean) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (value: SQLTag<Params> | ValueType, as?: string, cast?: string) => Return;
  Call: (tag: SQLTag<Params>, name: string, as?: string, cast?: string) => Return;
  Literal: (value: string | number | boolean | null, as?: string, cast?: string) => Return;
  StringLiteral: (value: string, as?: string, cast?: string) => Return;
  Raw: (run: TagFunctionVariable<Params, string>) => Return;
  Value: (run: TagFunctionVariable<Params>) => Return;
  Values: (run: TagFunctionVariable<Params, any[]>) => Return;
  Values2D: (run: TagFunctionVariable<Params, any[][]>) => Return;
};

interface ASTNode<Params> {
  caseOf<Return>(structureMap: StructureMap<Params, Return>): Return;
}

const astNode: symbol = Symbol ("@@ASTNode");

export const astNodePrototype = {
  [astNode]: true
};

export const isASTNode = function <Params> (value: any): value is ASTNode<Params> {
  return value != null && !!value[astNode];
};

export default ASTNode;