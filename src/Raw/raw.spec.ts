import isRaw from "./isRaw";
import raw from "./raw";

describe ("Raw `raw` - create a raw text type", () => {
  test ("raw text type created", () => {
    const lastNameCol = raw (`'lastName', "player".last_name`);

    expect (isRaw (lastNameCol)).toBe (true);
    expect (lastNameCol.value).toBe (`'lastName', "player".last_name`);
  });
});