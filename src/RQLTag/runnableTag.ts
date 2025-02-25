import { RQLTag } from ".";
import { getConvertPromise } from "../common/convertPromise";
import getDefaultQuerier from "../common/defaultQuerier";
import { Querier } from "../common/types";
import CUD from "./CUD";

const runnableTag = <TagType extends RQLTag | CUD>() => {
  const tag = ((params = {} as TagType["params"], querier?: Querier) => {
    const defaultQuerier = getDefaultQuerier ();
    const convertPromise = getConvertPromise ();

    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }
    return convertPromise (tag.run (params, (querier || defaultQuerier) as Querier) as Promise<TagType["type"]>);
  }) as TagType;

  return tag;
};

export default runnableTag;