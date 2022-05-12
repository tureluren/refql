import SQLTag from "../SQLTag";
import { RefQLConfig, RQLTag } from "../types";

const compile = (config: RefQLConfig, tag: RQLTag | SQLTag) =>
  tag.compile (config);

export default compile;