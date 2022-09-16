import chain from "./chain";

describe ("more `chain` - S_³-combinator", () => {
  test ("S_³-combinator", () => {
    type Rec = { comps: string[]; query: string};
    const rec: Rec = {
      comps: ["id", "last_name"],
      query: ""
    };

    expect (chain (
      (rec: Rec) => rec.comps,
      comps => rec => {
        rec.query = `select ${comps.join (", ")} from player`;
        return rec;
      }) (rec)
    ).toEqual ({
      comps: ["id", "last_name"],
      query: "select id, last_name from player"
    });
  });
});