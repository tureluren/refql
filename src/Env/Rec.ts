import { Ref, Refs, TagFunctionVariable } from "../common/types";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import Table from "../Table";


export interface Next {
  tag: RQLTag<unknown, unknown>;
  refs: Refs;
  lRef: Ref;
  rRef: Ref;
  as: string;
  single: boolean;
}

export default interface Rec {
  strings: TagFunctionVariable<unknown>[];
  sqlTag: SQLTag<unknown, unknown>;
  comps: (() => string)[];
  values: TagFunctionVariable<unknown>[];
  next: Next[];
  inCall: boolean;
}