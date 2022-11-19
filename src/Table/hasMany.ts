import Table from ".";
import { HasManyInfo } from "../common/types";
import { HasMany } from "../nodes";

const hasMany = (table: string, info: HasManyInfo) =>
  [HasMany, Table (table), info];

export default hasMany;