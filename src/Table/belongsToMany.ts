import Table from ".";
import { BelongsToManyInfo } from "../common/types";
import { BelongsToMany } from "../nodes";


const belongsToMany = (table: string, info: Omit<BelongsToManyInfo, "xTable"> & { xTable: string }) =>
  [BelongsToMany, Table (table), { ...info, xTable: Table (info.xTable) }];

export default belongsToMany;