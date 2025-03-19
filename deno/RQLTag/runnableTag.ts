import { RQLTag } from "./index.ts";
import { getConvertPromise } from "../common/convertPromise.ts";
import getDefaultQuerier from "../common/defaultQuerier.ts";
import { Querier } from "../common/types.ts";
import CUD from "./CUD.ts";

const runnableTag = <TagType extends RQLTag | CUD>() => {
  const tag = ((params = {} as TagType["params"], querier?: Querier) => {
    const defaultQuerier = getDefaultQuerier ();
    const convertPromise = getConvertPromise ();

    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }
    return convertPromise (tag.run (params, (querier || defaultQuerier) as Querier) as Promise<TagType["output"]>);
  }) as TagType;

  return tag;
};

export default runnableTag;