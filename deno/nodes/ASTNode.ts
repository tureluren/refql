import { RefQLValue } from "../common/types.ts";
import Table from "../Table/index.ts";
import { Keywords } from "./TableNode.ts";

type StructureMap<Params, Return> = Partial<{
  Root: (table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, true>) => Return;
  HasMany: (table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, true>) => Return;
  BelongsTo: (table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, true>) => Return;
  ManyToMany: (table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, true>) => Return;
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