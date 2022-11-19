import Table from ".";
import { HasOneInfo } from "../common/types";
import { HasOne } from "../nodes";

const hasOne = (table: string, info: HasOneInfo) =>
  [HasOne, Table (table), info];

export default hasOne;