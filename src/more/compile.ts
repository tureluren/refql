import RqlTag from "../RqlTag";
import SqlTag from "../SqlTag";
import { RefQLConfig } from "../types";

const compile = <Input> (config: RefQLConfig, tag: RqlTag<Input> | SqlTag<Input>) =>
  tag.compile (config);

export default compile;