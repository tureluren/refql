import Environment from ".";
import emptyRefs from "../RqlTag/emptyRefs";
import sql from "../SqlTag/sql";
import Table from "../Table";
import createEnv from "./createEnv";
import set from "./set";

describe ("Environment type", () => {
  test ("create Environment", () => {
    const record = {
      table: Table.of ("player"),
      sqlTag: sql``,
      query: "",
      values: [],
      next: [],
      comps: [],
      refs: emptyRefs (),
      inCall: false
    };

    const env = Environment.of (record);

    expect (env.record).toEqual (record);
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

    const setQuery = (e: Environment<{}>) => set ("query", "select *", e.record);
    const setInCall = (e: Environment<{}>) => set ("inCall", true, e.record);

    expect (env.extend (setQuery).extend (setInCall))
      .toEqual (env.extend (e => setInCall (e.extend (setQuery))));
  });
});