import { BelongsToInfo } from "../common/types";
import { BelongsTo } from "../nodes";


const belongsTo = (f: (name: string) => BelongsToInfo) => (name: string) =>
  [BelongsTo, f (name)];

export default belongsTo;