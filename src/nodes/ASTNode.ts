import {
  BelongsToInfo, BelongsToManyInfo,
  HasManyInfo, HasOneInfo, TagFunctionVariable, RefQLValue
} from "../common/types";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import Table from "../Table";

type StructureMap<Params, Return> = Partial<{
  BelongsTo: (tag: RQLTag<Params, unknown>, info: BelongsToInfo) => Return;
  BelongsToMany: (tag: RQLTag<Params, unknown>, info: BelongsToManyInfo) => Return;
  HasMany: (tag: RQLTag<Params, unknown>, info: HasManyInfo) => Return;
  HasOne: (tag: RQLTag<Params, unknown>, info: HasOneInfo) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (value: RefQLValue<Params, true>, as?: string, cast?: string) => Return;
  Call: (tag: SQLTag<Params, unknown>) => Return;
  StringLiteral: (value: string, as?: string, cast?: string) => Return;
  NumericLiteral: (value: number, as?: string, cast?: string) => Return;
  BooleanLiteral: (value: boolean, as?: string, cast?: string) => Return;
  NullLiteral: (value: null, as?: string, cast?: string) => Return;
  Raw: (run: TagFunctionVariable<Params>) => Return;
  Value: (run: TagFunctionVariable<Params>) => Return;
  Values: (run: (params: Params, table?: Table) => any[]) => Return;
  Values2D: (run: (params: Params, table?: Table) => any[][]) => Return;
}>;

interface ASTNode<Params> {
  caseOf<Return>(structureMap: StructureMap<Params, Return>): Return;
}

const astNode = Symbol ("@@ASTNode");

export const astNodePrototype = {
  [astNode]: true
};

export const isASTNode = function <Params> (value: any): value is ASTNode<Params> {
  return value != null && value[astNode];
};

export default ASTNode;