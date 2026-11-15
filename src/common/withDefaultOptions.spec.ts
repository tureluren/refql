import withDefaultOptions from "./withDefaultOptions";

describe ("withDefaultOptions", () => {
  test ("indexedParameters defaults to true", () => {
    expect (withDefaultOptions ({}).indexedParameters).toBe (true);
  });

  test ("indexedParameters: false is preserved", () => {
    expect (withDefaultOptions ({ indexedParameters: false }).indexedParameters).toBe (false);
  });
});
