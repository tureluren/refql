import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";

const isEmptyTag = <Params, Output>(tag: SQLTag<Params, Output> | RQLTag<Params, Output>) =>
  tag.nodes.length === 0;

export default isEmptyTag;