import concat from "./concat";

describe ("more `concat` - concat two semigroups", () => {
  test ("concat semigroups", () => {
    expect (concat ([3], [1, 2])).toEqual ([1, 2, 3]);
    expect (concat (3, [1, 2])).toEqual ([1, 2, 3]);
    expect (concat (3) ([1, 2])).toEqual ([1, 2, 3]);
  });
});