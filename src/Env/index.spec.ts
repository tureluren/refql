import Env from ".";
import emptyRefs from "../more/emptyRefs";
import sql from "../SQLTag/sql";
import Table from "../Table";
import { set } from "./access";
import createEnv from "./createEnv";

describe ("Env type", () => {
  test ("create Env", () => {
    const rec = {
      table: Table ("player"),
      sqlTag: sql``,
      query: "",
      values: [],
      next: [],
      comps: [],
      refs: emptyRefs (),
      inCall: false
    };

    const env = Env (rec);

    expect (env.rec).toEqual (rec);
  });

  test ("Functor", () => {
    const env = createEnv<{}> (Table ("player"));

    expect (env.map (r => r)).toEqual (env);

    const setQuery = set ("query", "select *");

    const setInCall = set ("inCall", true);

    expect (env.map (r => setInCall (setQuery (r))))
      .toEqual (env.map (setQuery).map (setInCall));
  });

  test ("Extend", () => {
    const env = createEnv<{}> (Table ("player"));

    const setQuery = (e: Env<{}>) => set ("query", "select *", e.rec);
    const setInCall = (e: Env<{}>) => set ("inCall", true, e.rec);

    expect (env.extend (setQuery).extend (setInCall))
      .toEqual (env.extend (e => setInCall (e.extend (setQuery))));
  });
});