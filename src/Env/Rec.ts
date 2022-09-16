import { Refs } from "../common/types";
import { ASTNode } from "../Parser/nodes";
import SQLTag from "../SQLTag";
import Table from "../Table";

export interface Next {
  node: ASTNode;
  refs: Refs;
}

export default interface Rec {
  table: Table;
  query: string;
  sqlTag: SQLTag<{}>;
  comps: string[];
  values: any[];
  next: Next[];
  refs: Refs;
  inCall: boolean;
}