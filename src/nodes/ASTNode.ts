import {
  TagFunctionVariable, ValueType, RefInfo
} from "../common/types";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";

type StructureMap<Params, Return, InRQL extends boolean = true> = {
  BelongsTo: (tag: RQLTag<Params>, info: RefInfo) => Return;
  BelongsToMany: (tag: RQLTag<Params>, info: Required<RefInfo>) => Return;
  HasMany: (tag: RQLTag<Params>, info: RefInfo) => Return;
  HasOne: (tag: RQLTag<Params>, info: RefInfo) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (value: SQLTag<Params> | ValueType, as?: string, cast?: string) => Return;
  Call: (tag: SQLTag<Params>, name: string, as?: string, cast?: string) => Return;
  Ref: (name: string, as: string) => Return;
  StringLiteral: (value: string, as?: string, cast?: string) => Return;
  NumericLiteral: (value: number, as?: string, cast?: string) => Return;
  BooleanLiteral: (value: boolean, as?: string, cast?: string) => Return;
  NullLiteral: (value: null, as?: string, cast?: string) => Return;
  Raw: (run: TagFunctionVariable<Params, InRQL>) => Return;
  Value: (run: TagFunctionVariable<Params, InRQL>) => Return;
  Values: (run: TagFunctionVariable<Params, InRQL, any[]>) => Return;
  Values2D: (run: TagFunctionVariable<Params, InRQL, any[][]>) => Return;
};

interface ASTNode<Params, InRQL extends boolean = true> {
  caseOf<Return>(structureMap: StructureMap<Params, Return, InRQL>): Return;
}

const astNode: symbol = Symbol ("@@ASTNode");

export const astNodePrototype = {
  [astNode]: true
};

export const isASTNode = function <Params> (value: any): value is ASTNode<Params> {
  return value != null && !!value[astNode];
};

export default ASTNode;