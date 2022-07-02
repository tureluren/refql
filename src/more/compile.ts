import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import { RefQLConfig } from "../types";

const compile = <Input, Output> (config: RefQLConfig, tag: RQLTag<Input, Output> | SQLTag) =>
  tag.compile (config);

export default compile;