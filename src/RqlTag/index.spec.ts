import RqlTag from ".";
import sql from "../SqlTag/sql";
import refQLConfig from "../test/refQLConfig";

describe ("RqlTag type", () => {
  test ("create RqlTag", () => {
    const string = "player { id lastName $ }";
    const keys = [sql`where id = 1`];
    const rqlTag = new RqlTag (string, keys);

    expect (rqlTag.string).toEqual (string);
    expect (rqlTag.keys).toEqual (keys);
  });

  test ("transform query result", () => {
    const rows = [
      { json_build_object: { id: 1, firstName: "John", lastName: "Doe" } },
      { json_build_object: { id: 2, firstName: "Jane", lastName: "Doe" } }
    ];

    expect (RqlTag.transform (refQLConfig, rows)).toEqual ([
      { id: 1, firstName: "John", lastName: "Doe" },
      { id: 2, firstName: "Jane", lastName: "Doe" }
    ]);
  });
});