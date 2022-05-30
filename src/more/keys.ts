import { Keys } from "../types";

const keys = <T>(obj: T): Keys<T> =>
  Object.keys (obj) as any;

export default keys;