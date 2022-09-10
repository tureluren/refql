import Raw from ".";

describe ("Raw type", () => {
  test ("create Raw", () => {
    const raw = Raw ("select id");

    expect (raw.value).toBe ("select id");
    expect (`${raw}`).toBe ("Raw (select id)");
  });
});