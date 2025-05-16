import defaultRunner from "./defaultRunner";
import dummyQuerier from "./dummyQuerier";
import { RefQLOptions, RequiredRefQLOptions } from "./types";

const withDefaultOptions = (options: Partial<RefQLOptions>): RequiredRefQLOptions => {
  return {
    querier: options.querier || dummyQuerier,
    runner: options.runner || defaultRunner,
    parameterSign: options.parameterSign || "$",
    indexedParameters: options.indexedParameters || true
  };
};

export default withDefaultOptions;