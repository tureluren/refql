import arePlurals from "./arePlurals";

describe ("predicate `arePlurals` - checks whether a given value is an Object with valid Plurals", () => {
  test ("are Plurals", () => {
    expect (arePlurals ({ person: "people" })).toBe (true);
  });

  test ("are not Plurals", () => {
    expect (arePlurals ({ person: ["people"] })).toBe (false);
    expect (arePlurals ({ person: 1 })).toBe (false);
    expect (arePlurals ({ person: null })).toBe (false);
    expect (arePlurals ({ person: undefined })).toBe (false);
    expect (arePlurals ({ person: true })).toBe (false);
  });
});