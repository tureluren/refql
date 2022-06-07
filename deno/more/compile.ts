import RQLTag from "../RQLTag/index.ts";
import SQLTag from "../SQLTag/index.ts";
import { RefQLConfig } from "../types.ts";

const compile = (config: RefQLConfig, tag: RQLTag | SQLTag) =>
  tag.compile (config);

export default compile;