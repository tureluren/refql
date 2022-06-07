import { Keys } from "../types.ts";

const keys = <T>(obj: T): Keys<T> =>
  Object.keys (obj) as any;

export default keys;