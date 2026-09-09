import { Runner } from "./types.ts";

const defaultRunner: Runner = (
  tag,
  params = {}
) => {
  return tag.run (params);
};

export default defaultRunner;