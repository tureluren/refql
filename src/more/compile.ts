import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import { RefQLConfig } from "../types";

const compile = <Input> (config: RefQLConfig, tag: RQLTag<Input> | SQLTag<Input>) =>
  tag.compile (config);

export default compile;