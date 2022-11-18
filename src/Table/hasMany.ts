import { HasManyInfo } from "../common/types";
import { HasMany } from "../nodes";

const hasMany = (f: (name: string) => HasManyInfo) => (name: string) =>
  [HasMany, f (name)];

export default hasMany;