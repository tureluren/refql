import { RQLTag } from "../RQLTag";
import { SQLTag } from "../SQLTag";

const isEmptyTag = (tag: SQLTag | RQLTag) =>
  tag.nodes.length === 0;

export default isEmptyTag;