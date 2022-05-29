import defaultConfig from "./defaultConfig";

describe ("RefQL `defaultConfig` - sets default values on missing props", () => {
  test ("defaults set", () => {
    expect (defaultConfig ({})).toEqual ({
      detectRefs: true,
      pluralize: true,
      plurals: {},
      refs: {},
      useSmartAlias: true
    });

    expect (defaultConfig ({ detectRefs: false })).toEqual ({
      detectRefs: false,
      pluralize: true,
      plurals: {},
      refs: {},
      useSmartAlias: true
    });

    expect (defaultConfig ({ detectRefs: false, plurals: { player: "teammates" } })).toEqual ({
      detectRefs: false,
      pluralize: true,
      plurals: { player: "teammates" },
      refs: {},
      useSmartAlias: true
    });

    const debug = () => null;

    expect (defaultConfig ({ pluralize: false, debug })).toEqual ({
      debug,
      detectRefs: true,
      pluralize: false,
      plurals: {},
      refs: {},
      useSmartAlias: true
    });
  });
});