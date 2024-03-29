import { RQLTag } from "../RQLTag/index.ts";
import { SQLTag } from "../SQLTag/index.ts";

const isEmptyTag = (tag: SQLTag | RQLTag) =>
  tag.nodes.length === 0;

export default isEmptyTag;