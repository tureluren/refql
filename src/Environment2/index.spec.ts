import Environment from ".";
import emptyRefs from "../RqlTag/emptyRefs";
import sql from "../SqlTag/sql";
import Table from "../Table";
import createEnv from "./createEnv";
import set from "./set";

describe ("Environment type", () => {
  test ("create Environment", () => {
    const rec = {
      table: Table.of ("player"),
      sqlTag: sql``,
      query: "",
      values: [],
      next: [],
      comps: [],
      refs: emptyRefs (),
      inCall: false
    };

    const env = Environment.of (rec);

    expect (env.rec).toEqual (rec);
  });

  test ("Functor", () => {
    const env = createEnv<{}> (Table.of ("player"));

    expect (env.map (r => r)).toEqual (env);

    const setQuery = set ("query", "select *");
    const setInCall = set ("inCall", true);

    expect (env.map (r => setInCall (setQuery (r))))
      .toEqual (env.map (setQuery).map (setInCall));
  });

  test ("Extend", () => {
    const env = createEnv<{}> (Table.of ("player"));

    const setQuery = (e: Environment<{}>) => set ("query", "select *", e.rec);
    const setInCall = (e: Environment<{}>) => set ("inCall", true, e.rec);

    expect (env.extend (setQuery).extend (setInCall))
      .toEqual (env.extend (e => setInCall (e.extend (setQuery))));
  });
});