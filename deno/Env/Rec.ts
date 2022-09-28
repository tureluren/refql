import { Refs } from "../common/types.ts";
import { ASTNode } from "../nodes/index.ts";
import SQLTag from "../SQLTag/index.ts";
import Table from "../Table/index.ts";

export interface Next {
  node: ASTNode<unknown>;
  refs: Refs;
}

export default interface Rec {
  table: Table;
  query: string;
  sqlTag: SQLTag<unknown>;
  comps: string[];
  values: any[];
  next: Next[];
  refs: Refs;
  inCall: boolean;
}