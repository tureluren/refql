import { Runner } from "./types";

const defaultRunner: Runner = (
  tag,
  params = {}
) => {
  return tag.run (params);
};

export default defaultRunner;