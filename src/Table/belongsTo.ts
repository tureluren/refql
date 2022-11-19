import Table from ".";
import { BelongsToInfo } from "../common/types";
import { BelongsTo } from "../nodes";

const belongsTo = (table: string, info: BelongsToInfo) =>
  [BelongsTo, Table (table), info];

export default belongsTo;