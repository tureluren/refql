import keys from "../more/keys";
import { RefQLConfig } from "../types";

const defaults: RefQLConfig = {
  detectRefs: true,
  pluralize: true,
  plurals: {},
  refs: {},
  useSmartAlias: true
};

const defaultConfig = (config: Partial<RefQLConfig>): RefQLConfig => {
  const result = Object.assign ({}, config);

  keys<RefQLConfig> (defaults).forEach (key => {
    if (result[key] == null) {
      result[key] = defaults[key];
    }
  });

  return result as RefQLConfig;
};

export default defaultConfig;