// @ts-nocheck
import validateConfig from "./validateConfig";
import defaultConfig from "./defaultConfig";

describe ("RefQL `validateConfig` - validate config object passed by user", () => {
  test ("`pluralize` validated", () => {
    expect (validateConfig (defaultConfig ({ pluralize: true }))).toBe (true);
    expect (validateConfig (defaultConfig ({ pluralize: false }))).toBe (true);
    expect (validateConfig (defaultConfig ({ pluralize: null }))).toBe (true);
    expect (validateConfig (defaultConfig ({ pluralize: undefined }))).toBe (true);

    expect (() => validateConfig (defaultConfig (({ pluralize: "" }))))
      .toThrowError (new TypeError ("`pluralize` should be of type Boolean"));

    expect (() => validateConfig (defaultConfig (({ pluralize: 1 }))))
      .toThrowError (new TypeError ("`pluralize` should be of type Boolean"));
  });

  test ("`caseTypeJS` validated", () => {
    expect (validateConfig (defaultConfig ({ caseTypeJS: "camel" }))).toBe (true);
    expect (validateConfig (defaultConfig ({ caseTypeJS: "snake" }))).toBe (true);
    expect (validateConfig (defaultConfig ({ caseTypeJS: null }))).toBe (true);
    expect (validateConfig (defaultConfig ({ caseTypeJS: undefined }))).toBe (true);

    expect (() => validateConfig (defaultConfig (({ caseTypeJS: "" }))))
      .toThrowError (new TypeError ("caseTypeJS should be one of the following: camel, snake"));

    expect (() => validateConfig (defaultConfig (({ caseTypeJS: 1 }))))
      .toThrowError (new TypeError ("caseTypeJS should be one of the following: camel, snake"));
  });

  test ("`caseType` validated", () => {
    expect (validateConfig (defaultConfig ({ caseType: "camel" }))).toBe (true);
    expect (validateConfig (defaultConfig ({ caseType: "snake" }))).toBe (true);
    expect (validateConfig (defaultConfig ({ caseType: null }))).toBe (true);
    expect (validateConfig (defaultConfig ({ caseType: undefined }))).toBe (true);

    expect (() => validateConfig (defaultConfig (({ caseType: "" }))))
      .toThrowError (new TypeError ("caseType should be one of the following: camel, snake"));

    expect (() => validateConfig (defaultConfig (({ caseType: 1 }))))
      .toThrowError (new TypeError ("caseType should be one of the following: camel, snake"));
  });

  test ("`debug` validated", () => {
    expect (validateConfig (defaultConfig ({ debug: () => null }))).toBe (true);
    expect (validateConfig (defaultConfig ({ debug: null }))).toBe (true);
    expect (validateConfig (defaultConfig ({ debug: undefined }))).toBe (true);

    expect (() => validateConfig (defaultConfig (({ debug: "" }))))
      .toThrowError (new TypeError ("`debug` should be of type Function"));

    expect (() => validateConfig (defaultConfig (({ debug: 1 }))))
      .toThrowError (new TypeError ("`debug` should be of type Function"));
  });

  test ("`detectRefs` validated", () => {
    expect (validateConfig (defaultConfig ({ detectRefs: true }))).toBe (true);
    expect (validateConfig (defaultConfig ({ detectRefs: false }))).toBe (true);
    expect (validateConfig (defaultConfig ({ detectRefs: null }))).toBe (true);
    expect (validateConfig (defaultConfig ({ detectRefs: undefined }))).toBe (true);

    expect (() => validateConfig (defaultConfig (({ detectRefs: "" }))))
      .toThrowError (new TypeError ("`detectRefs` should be of type Boolean"));

    expect (() => validateConfig (defaultConfig (({ detectRefs: 1 }))))
      .toThrowError (new TypeError ("`detectRefs` should be of type Boolean"));
  });

  test ("`plurals` validated", () => {
    expect (validateConfig (defaultConfig ({ plurals: { players: "teammates" } }))).toBe (true);
    expect (validateConfig (defaultConfig ({ plurals: null }))).toBe (true);
    expect (validateConfig (defaultConfig ({ plurals: undefined }))).toBe (true);

    expect (() => validateConfig (defaultConfig ({ plurals: { players: 1 } })))
      .toThrowError (new TypeError ('`plurals` should be of type { singular: "plural"}'));

    expect (() => validateConfig (defaultConfig ({ plurals: [] })))
      .toThrowError (new TypeError ('`plurals` should be of type { singular: "plural"}'));
  });

  test ("`refs` validated", () => {
    expect (validateConfig (defaultConfig ({
      refs: {
        player: {
          team: [["team_id", "id"]]
        },
        game: {
          "team/1": [["home_team_id", "id"]],
          "team/2": [["away_team_id", "id"]]
        }
      }
    }))).toBe (true);
    expect (validateConfig (defaultConfig ({ refs: null }))).toBe (true);
    expect (validateConfig (defaultConfig ({ refs: undefined }))).toBe (true);

    expect (() => validateConfig (defaultConfig ({ refs: "" })))
      .toThrowError (new TypeError ('`refs` should be of type { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }'));

    expect (() => validateConfig (defaultConfig ({ refs: { team: [["team_id", "id"]] } })))
      .toThrowError (new TypeError ('`refs` should be of type { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }'));
  });

  test ("`onSetupError` validated", () => {
    expect (validateConfig (defaultConfig ({ onSetupError: () => null }))).toBe (true);
    expect (validateConfig (defaultConfig ({ onSetupError: null }))).toBe (true);
    expect (validateConfig (defaultConfig ({ onSetupError: undefined }))).toBe (true);

    expect (() => validateConfig (defaultConfig (({ onSetupError: "" }))))
      .toThrowError (new TypeError ("`onSetupError` should be of type Function"));

    expect (() => validateConfig (defaultConfig (({ onSetupError: 1 }))))
      .toThrowError (new TypeError ("`onSetupError` should be of type Function"));
  });
});