import { RQLTag } from ".";
import CUD from "./CUD";

const runnableTag = <TagType extends RQLTag | CUD>() => {
  const tag = ((params = {} as TagType["params"]) => {
    const convertPromise = getConvertPromise ();

    return convertPromise (tag.run (params) as Promise<TagType["output"]>);
  }) as TagType;

  return tag;
};

export default runnableTag;