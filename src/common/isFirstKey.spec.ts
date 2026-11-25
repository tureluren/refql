import isFirstKey from "./isFirstKey";

describe ("common `isFirstKey`", () => {
  const props = [{ col: "undo_reason", as: "undoReason" }, { col: "undone_at", as: "undoneAt" }, { col: "id", as: "id" }];

  test ("the first present key in the same order as the update SET clause (localeCompare)", () => {
    const first = isFirstKey (props);
    const data = { undoReason: "x", undoneAt: 1 };
    // localeCompare: "undoneAt" < "undoReason" (the default sort says the opposite).
    expect (["undoReason", "undoneAt"].sort ((a, b) => a.localeCompare (b))).toEqual (["undoneAt", "undoReason"]);
    expect (first (data, "undoneAt")).toBe (true);
    expect (first (data, "undoReason")).toBe (false);
  });

  test ("undefined values and keys that are no standard prop do not count", () => {
    const first = isFirstKey (props);
    expect (first ({ undoneAt: undefined, undoReason: "x", other: 1 } as any, "undoReason")).toBe (true);
  });
});
