import { Refs } from "../common/types";
import { ASTNode } from "../nodes";
import SQLTag from "../SQLTag";
import Table from "../Table";

export interface Next {
  node: ASTNode<unknown>;
  refs: Refs;
}

export default interface Rec {
  table: Table;
  query: string;
  sqlTag: SQLTag<unknown, unknown>;
  comps: string[];
  values: any[];
  next: Next[];
  refs: Refs;
  inCall: boolean;
}