import Raw from ".";
import isRaw from "./isRaw";

describe ("Raw `isRaw` - detects if a given value is a Raw", () => {
  test ("Raw detected", () => {
    const raw = new Raw ("select id");

    expect (isRaw (raw)).toBe (true);
  });
});