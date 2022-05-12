import { PoolConfig } from "pg";
import { RefQLConfig } from "../types";
import defaultConfig from "./defaultConfig";

const configKeys = [
  "pluralize", "caseTypeJS", "caseTypeDB",
  "debug", "detectRefs", "plurals", "refs", "useSmartAlias"
];

const branchConfig = (userConfig: PoolConfig & Partial<RefQLConfig>): [PoolConfig, RefQLConfig] => {
  const poolConfig = {};
  const refQLConfig = {};

  Object.keys (userConfig).forEach (key => {
    if (configKeys.includes (key)) {
      refQLConfig[key] = userConfig[key];
    } else {
      poolConfig[key] = userConfig[key];
    }
  });

  return [poolConfig, defaultConfig (refQLConfig)];
};

export default branchConfig;