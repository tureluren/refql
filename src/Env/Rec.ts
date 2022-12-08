import { Refs, TagFunctionVariable } from "../common/types";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import Table from "../Table";


export interface Next {
  tag: RQLTag<unknown, unknown>;
  refs: Refs;
  as: string;
  refType: "BelongsTo" | "HasOne";
}

export default interface Rec {
  table: Table;
  strings: TagFunctionVariable<unknown>[];
  sqlTag: SQLTag<unknown, unknown>;
  comps: (() => string)[];
  values: TagFunctionVariable<unknown>[];
  next: Next[];
  refs: Refs;
  inCall: boolean;
}