import { BelongsToManyInfo } from "../common/types";
import { BelongsToMany } from "../nodes";


const belongsToMany = (f: (name: string) => BelongsToManyInfo) => (name: string) =>
  [BelongsToMany, f (name)];

export default belongsToMany;