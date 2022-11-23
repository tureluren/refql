import Raw from ".";
import { flMap } from "../common/consts";

describe ("Raw type", () => {
  test ("create Raw", () => {
    const raw = Raw ("select id");

    expect (raw.value).toBe ("select id");
    expect (Raw.isRaw (raw)).toBe (true);
    expect (Raw.isRaw ({})).toBe (false);
  });

  test ("Functor", () => {
    const toUpper = (s: string) => s.toUpperCase ();
    const trim = (s: string) => s.trim ();
    const raw = Raw (" select id ");

    expect (raw[flMap] (s => s)).toEqual (raw);

    expect (raw[flMap] (s => trim (toUpper (s))))
      .toEqual (raw[flMap] (toUpper)[flMap] (trim));
  });
});