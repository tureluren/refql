import defaultRunner from "./defaultRunner.ts";
import dummyQuerier from "./dummyQuerier.ts";
import { RefQLOptions, RequiredRefQLOptions } from "./types.ts";

const withDefaultOptions = (options: Partial<RefQLOptions>): RequiredRefQLOptions => {
  return {
    querier: options.querier || dummyQuerier,
    runner: options.runner || defaultRunner,
    parameterSign: options.parameterSign || "$",
    indexedParameters: options.indexedParameters || true
  };
};

export default withDefaultOptions;