import branchConfig from "./branchConfig";
import userConfig from "../test/userConfig";
import refQLConfig from "../test/refQLConfig";

describe ("RefQL `branchConfig` - separates pg's pool config from RefQL's config", () => {
  test ("config branched", () => {
    const [poolConfig, config] = branchConfig ({
      ...userConfig,
      ...refQLConfig
    });

    expect (poolConfig).toEqual (poolConfig);
    expect (refQLConfig).toEqual (config);
  });


  test ("default config values", () => {
    const debug = () => null;

    const [poolConfig, defaultConfig] = branchConfig ({
      debug,
      caseTypeDB: "camel"
    });

    expect (poolConfig).toEqual ({});
    expect (defaultConfig).toEqual ({
      pluralize: true,
      useSmartAlias: true,
      caseTypeDB: "camel",
      debug,
      detectRefs: true,
      plurals: {},
      refs: {}
    });
  });
});