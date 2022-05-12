// @ts-nocheck
import Raw from ".";

describe ("Raw type", () => {
  test ("create Raw", () => {
    const raw = new Raw ("select id");

    expect (raw.value).toBe ("select id");
  });

  test ("throws Error when raw value is not a String", () => {
    expect (() => new Raw (1)).toThrowError (new TypeError ("Raw must wrap a String"));
    expect (() => new Raw (true)).toThrowError (new TypeError ("Raw must wrap a String"));
    expect (() => new Raw ([])).toThrowError (new TypeError ("Raw must wrap a String"));
    expect (() => new Raw ({})).toThrowError (new TypeError ("Raw must wrap a String"));
    expect (() => new Raw (null)).toThrowError (new TypeError ("Raw must wrap a String"));
  });
});