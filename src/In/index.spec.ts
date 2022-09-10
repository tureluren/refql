import In from ".";

describe ("In type", () => {
  test ("create In", () => {
    const inn = In ([1, 2, 3]);

    expect (inn.arr).toEqual ([1, 2, 3]);
    expect (`${inn}`).toBe ("In ([1,2,3])");
  });
});