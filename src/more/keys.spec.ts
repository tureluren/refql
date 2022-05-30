import keys from "./keys";

describe ("more `keys` - gets Object keys inside an array", () => {
  test ("got Object keys", () => {
    expect (
      keys ({ firstName: "John", lastName: "Doe" })
    ).toEqual (["firstName", "lastName"]);
  });
});