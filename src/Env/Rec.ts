import { Refs, TagFunctionVariable } from "../common/types";
import { ASTNode } from "../nodes";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import Table from "../Table";

export default interface Rec {
  table: Table;
  strings: TagFunctionVariable<unknown>[];
  sqlTag: SQLTag<unknown, unknown>;
  comps: (() => string)[];
  values: TagFunctionVariable<unknown>[];
  next: RQLTag<unknown, unknown>[];
  refs: Refs;
  inCall: boolean;
}