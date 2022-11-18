import { HasOneInfo } from "../common/types";
import { HasOne } from "../nodes";

const hasOne = (f: (name: string) => HasOneInfo) => (name: string) =>
  [HasOne, f (name)];

export default hasOne;