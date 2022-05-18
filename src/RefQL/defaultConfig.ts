import { RefQLConfig } from "../types";

const defaults: RefQLConfig = {
  detectRefs: true,
  pluralize: true,
  plurals: {},
  refs: {},
  useSmartAlias: true
};

const defaultConfig = (config: Partial<RefQLConfig>) => {
  const result = Object.assign ({}, config);

  Object.keys (defaults).forEach (key => {
    if (result[key] == null) {
      result[key] = defaults[key];
    }
  });

  return <RefQLConfig>result;
};

export default defaultConfig;