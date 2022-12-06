import {
  BelongsToInfo, BelongsToManyInfo,
  HasManyInfo, HasOneInfo, TagFunctionVariable, RefQLValue
} from "../common/types";
import Table from "../Table";

type StructureMap<Params, Return> = Partial<{
  Root: (table: Table, members: ASTNode<Params>[]) => Return;
  BelongsTo: (table: Table, members: ASTNode<Params>[], info: BelongsToInfo) => Return;
  BelongsToMany: (table: Table, members: ASTNode<Params>[], info: BelongsToManyInfo) => Return;
  HasMany: (table: Table, members: ASTNode<Params>[], info: HasManyInfo) => Return;
  HasOne: (table: Table, members: ASTNode<Params>[], info: HasOneInfo) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (value: RefQLValue<Params, true>, as?: string, cast?: string) => Return;
  Call: (name: string, members: ASTNode<Params>[], as?: string, cast?: string) => Return;
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