import Sub from "./index.ts";
import { SQLTag_ } from "../types.ts";

const subselect = (as: string, tag: SQLTag_) =>
  new Sub (as, tag);

export default subselect;