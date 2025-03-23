import { RQLTag } from "../RQLTag";
import CUD from "../RQLTag/CUD";
import { Runner } from "./types";

const defaultRunner: Runner = <TagType extends RQLTag | CUD, T>(
  tag: TagType,
  params = {} as TagType["params"]
) => {
  return tag.run (params) as unknown as T;
};

export default defaultRunner;