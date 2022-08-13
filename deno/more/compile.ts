import RqlTag from "../RqlTag/index.ts";
import SqlTag from "../SqlTag/index.ts";
import { RefQLConfig } from "../types.ts";

const compile = (config: RefQLConfig, tag: RqlTag | SqlTag) =>
  tag.compile (config);

export default compile;