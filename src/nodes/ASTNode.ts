import { Boxes } from "../common/BoxRegistry";
import { TagFunctionVariable, ValueType, RefInfo, RefQLRows } from "../common/types";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";

export type StructureMap<Params, Output, Box extends Boxes, Return> = {
  RefNode: (tag: RQLTag<any, Params & RefQLRows, Output, Box>, info: RefInfo<Box>, single: boolean) => Return;
  BelongsToMany: (tag: RQLTag<any, Params & RefQLRows, Output, Box>, info: Required<RefInfo<Box>>, single: boolean) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (x: SQLTag<Params, Output, Box> | ValueType, as?: string, cast?: string) => Return;
  Call: (tag: SQLTag<Params, Output, Box>, name: string, as?: string, cast?: string) => Return;
  Literal: (x: string | number | boolean | null, as?: string, cast?: string) => Return;
  StringLiteral: (x: string, as?: string, cast?: string) => Return;
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