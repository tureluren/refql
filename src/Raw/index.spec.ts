import Raw from ".";

describe ("Raw type", () => {
  test ("create Raw", () => {
    const raw = Raw.of ("select id");

    expect (raw.value).toBe ("select id");
    expect (`${raw}`).toBe ("Raw (select id)");
  });
});