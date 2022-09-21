import Env from ".";
import { flExtend, flMap } from "../common/consts";
import emptyRefs from "../common/emptyRefs";
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
    expect (Env.isEnv (env)).toBe (true);
    expect (Env.isEnv ({})).toBe (false);
  });

  test ("Functor", () => {
    const env = createEnv (Table ("player"));

    expect (env[flMap] (r => r)).toEqual (env);

    const setQuery = set ("query", "select *");

    const setInCall = set ("inCall", true);

    expect (env[flMap] (r => setInCall (setQuery (r))))
      .toEqual (env[flMap] (setQuery)[flMap] (setInCall));
  });

  test ("Extend", () => {
    const env = createEnv (Table ("player"));

    const setQuery = (e: Env) => set ("query", "select *", e.rec);
    const setInCall = (e: Env) => set ("inCall", true, e.rec);

    expect (env[flExtend] (setQuery)[flExtend] (setInCall))
      .toEqual (env[flExtend] (e => setInCall (e[flExtend] (setQuery))));
  });
});