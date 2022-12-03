import In from ".";

describe ("In type", () => {
  test ("create In", () => {
    const inn = In ([1, 2, 3]);

    expect (inn.arr).toEqual ([1, 2, 3]);
    expect (In.isIn (inn)).toBe (true);
    expect (In.isIn ({})).toBe (false);
  });

  test ("compile In", () => {
    const arr = [1, 2, 3];
    const inn = In (arr);
    const [query, values] = inn.compile ();

    expect (query).toBe ("in ($1, $2, $3)");
    expect (values).toEqual (arr);
  });
});