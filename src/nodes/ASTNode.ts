import { RefQLValue } from "../common/types";
import Table from "../Table";

type StructureMap<Params, Return> = Partial<{
  Root: (table: Table, members: ASTNode<Params>[]) => Return;
  HasMany: (table: Table, members: ASTNode<Params>[]) => Return;
  HasOne: (table: Table, members: ASTNode<Params>[]) => Return;
  BelongsTo: (table: Table, members: ASTNode<Params>[]) => Return;
  BelongsToMany: (table: Table, members: ASTNode<Params>[]) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (value: RefQLValue<Params, true>, as?: string, cast?: string) => Return;
  Call: (name: string, members: ASTNode<Params>[], as?: string, cast?: string) => Return;
  StringLiteral: (value: string, as?: string, cast?: string) => Return;
  NumericLiteral: (value: number, as?: string, cast?: string) => Return;
  BooleanLiteral: (value: boolean, as?: string, cast?: string) => Return;
  NullLiteral: (value: null, as?: string, cast?: string) => Return;
}>;

interface ASTNode<Params> {
  caseOf<Return>(structureMap: StructureMap<Params, Return>, params: Params, table: Table): Return;
  isASTNode: boolean;
}

export const astNodePrototype = {
  isASTNode: true
};

export default ASTNode;