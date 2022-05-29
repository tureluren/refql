import validateKeywords from "./validateKeywords";

describe ("Parser `validateKeywords` - validate keywords passed by user", () => {
  test ("`as` validated", () => {
    expect (validateKeywords ({ as: "player" })).toBe (true);
    expect (validateKeywords ({ as: "" })).toBe (true);
    expect (validateKeywords ({ as: null })).toBe (true);
    expect (validateKeywords ({ as: undefined })).toBe (true);

    expect (() => validateKeywords ({ as: 1 }))
      .toThrowError (new TypeError ("`as` should be of type String"));

    expect (() => validateKeywords ({ as: { player: "team" } }))
      .toThrowError (new TypeError ("`as` should be of type String"));

    expect (() => validateKeywords ({ as: [1, 2, 3] }))
      .toThrowError (new TypeError ("`as` should be of type String"));
  });

  test ("`xTable` validated", () => {
    expect (validateKeywords ({ xTable: "player" })).toBe (true);
    expect (validateKeywords ({ xTable: "" })).toBe (true);
    expect (validateKeywords ({ xTable: null })).toBe (true);
    expect (validateKeywords ({ xTable: undefined })).toBe (true);

    expect (() => validateKeywords ({ xTable: 1 }))
      .toThrowError (new TypeError ("`xTable` should be of type String"));

    expect (() => validateKeywords ({ xTable: { player: "team" } }))
      .toThrowError (new TypeError ("`xTable` should be of type String"));

    expect (() => validateKeywords ({ xTable: [1, 2, 3] }))
      .toThrowError (new TypeError ("`xTable` should be of type String"));
  });

  test ("`links` validated", () => {
    expect (validateKeywords ({ links: [["teamId", "id"]] })).toBe (true);
    expect (validateKeywords ({ links: null })).toBe (true);
    expect (validateKeywords ({ links: undefined })).toBe (true);

    expect (() => validateKeywords ({ links: ["teamId", "id"] }))
      .toThrowError (new TypeError ('`links` should be of type [["tableFromCol", "tableToCol"]]'));

    expect (() => validateKeywords ({ links: 1 }))
      .toThrowError (new TypeError ('`links` should be of type [["tableFromCol", "tableToCol"]]'));

    expect (() => validateKeywords ({ links: { player: "team" } }))
      .toThrowError (new TypeError ('`links` should be of type [["tableFromCol", "tableToCol"]]'));
  });

  test ("`refs` validated", () => {
    expect (validateKeywords ({ refs: { team: [["teamId", "id"]] } })).toBe (true);
    expect (validateKeywords ({ refs: null })).toBe (true);
    expect (validateKeywords ({ refs: undefined })).toBe (true);

    expect (() => validateKeywords ({ refs: { team: ["teamId", "id"] } }))
      .toThrowError (new TypeError (
        '`refs` should be of type { table1: [["xTableFromCol", "table1ToCol"]], table2: [["xTableFromCol", "table2ToCol"]] }'
      ));

    expect (() => validateKeywords ({ refs: "team" }))
      .toThrowError (new TypeError (
        '`refs` should be of type { table1: [["xTableFromCol", "table1ToCol"]], table2: [["xTableFromCol", "table2ToCol"]] }'
      ));

    expect (() => validateKeywords ({ refs: 1 }))
      .toThrowError (new TypeError (
        '`refs` should be of type { table1: [["xTableFromCol", "table1ToCol"]], table2: [["xTableFromCol", "table2ToCol"]] }'
      ));
  });

  test ("`id` validated", () => {
    expect (validateKeywords ({ id: 1 })).toBe (true);
    expect (validateKeywords ({ id: "1" })).toBe (true);
    expect (validateKeywords ({ id: "" })).toBe (true);
    expect (validateKeywords ({ id: null })).toBe (true);
    expect (validateKeywords ({ id: undefined })).toBe (true);

    expect (() => validateKeywords ({ id: true }))
      .toThrowError (new TypeError ("`id` should be of type String or Number"));

    expect (() => validateKeywords ({ id: { player: "team" } }))
      .toThrowError (new TypeError ("`id` should be of type String or Number"));

    expect (() => validateKeywords ({ id: [1, 2, 3] }))
      .toThrowError (new TypeError ("`id` should be of type String or Number"));
  });

  test ("`limit` validated", () => {
    expect (validateKeywords ({ limit: 1 })).toBe (true);
    expect (validateKeywords ({ limit: null })).toBe (true);
    expect (validateKeywords ({ limit: undefined })).toBe (true);

    expect (() => validateKeywords ({ limit: "" }))
      .toThrowError (new TypeError ("`limit` should be of type Number"));

    expect (() => validateKeywords ({ limit: true }))
      .toThrowError (new TypeError ("`limit` should be of type Number"));

    expect (() => validateKeywords ({ limit: { player: "team" } }))
      .toThrowError (new TypeError ("`limit` should be of type Number"));

    expect (() => validateKeywords ({ limit: [1, 2, 3] }))
      .toThrowError (new TypeError ("`limit` should be of type Number"));
  });

  test ("`offset` validated", () => {
    expect (validateKeywords ({ offset: 1 })).toBe (true);
    expect (validateKeywords ({ offset: null })).toBe (true);
    expect (validateKeywords ({ offset: undefined })).toBe (true);

    expect (() => validateKeywords ({ offset: "" }))
      .toThrowError (new TypeError ("`offset` should be of type Number"));

    expect (() => validateKeywords ({ offset: true }))
      .toThrowError (new TypeError ("`offset` should be of type Number"));

    expect (() => validateKeywords ({ offset: { player: "team" } }))
      .toThrowError (new TypeError ("`offset` should be of type Number"));

    expect (() => validateKeywords ({ offset: [1, 2, 3] }))
      .toThrowError (new TypeError ("`offset` should be of type Number"));
  });
});