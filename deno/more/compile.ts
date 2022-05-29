import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import { RefQLConfig } from "../types";

const compile = (config: RefQLConfig, tag: RQLTag | SQLTag) =>
  tag.compile (config);

export default compile;