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

  // test ("lookup values", () => {
  //   const root = new Environment ({ query: "json_build_object(", table: new Table ("player", "p"), sql: "where id = 1" });
  //   const parent = new Environment ({ table: new Table ("team", "t"), sql: "where id = 2" }, root);
  //   const env = new Environment ({ sql: "where id = 3" }, parent);

  //   expect (env.lookup ("sql")).toBe ("where id = 3");
  //   expect (env.lookup ("table")!.name).toBe ("team");
  //   expect (env.lookup ("query")).toBe ("json_build_object(");

  //   expect (() => env.lookup ("inFunction")).toThrowError (new ReferenceError ('Variable "inFunction" is undefined'));
  // });

  // test ("assign values", () => {
  //   const root = new Environment ({ query: "json_build_object(", table: new Table ("player", "p"), sql: "where id = 1" }, null);
  //   const parent = new Environment ({ table: new Table ("team", "t"), sql: "where id = 2" }, root);
  //   const env = new Environment ({ sql: "where id = 3" }, parent);

  //   const updatedSql = { sql: "where id = 4" };
  //   env.assign ("sql", updatedSql.sql);
  //   expect (env).toEqual (new Environment (updatedSql, parent));

  //   const updatedTable = { table: new Table ("position", "p"), sql: "where id = 2" };
  //   env.assign ("table", updatedTable.table);
  //   expect (env).toEqual (new Environment (updatedSql, new Environment (updatedTable, root)));

  //   const updatedQuery = { query: "json_build_object('id'", table: new Table ("player", "p"), sql: "where id = 1" };
  //   env.assign ("query", updatedQuery.query);
  //   expect (env).toEqual (new Environment (updatedSql, new Environment (updatedTable, new Environment (updatedQuery, null))));

  //   expect (() => env.assign ("inFunction", true)).toThrowError (new ReferenceError ('Variable "inFunction" is undefined'));
  // });

  // test ("adding values", () => {
  //   const env = new Environment ({ values: [], keyIdx: 0 }, null);

  //   env.addValues ([99]);

  //   expect (env).toEqual (new Environment ({ values: [99], keyIdx: 1 }, null));
  // });

  // test ("write to sql", () => {
  //   const env = new Environment ({ sql: "" }, null);

  //   env.writeToSQL ("where id = 1");
  //   env.writeToSQL ("and last_name = 'Lee'");

  //   expect (env.lookup ("sql")).toBe ("where id = 1 and last_name = 'Lee'");
  // });

  // test ("write to query", () => {
  //   const env = new Environment ({ query: "" }, null);

  //   // select
  //   env.writeToQuery ("select json_build_object(");

  //   // identifiers
  //   env.writeToQuery ("'id', \"player\".id");
  //   env.writeToQuery ("'lastName', \"player\".last_name");

  //   // from
  //   env.writeToQuery (') from "player" "player"');

  //   const expected =
  //     "select json_build_object('id', \"player\".id, 'lastName', \"player\".last_name) from \"player\" \"player\"";

  //   expect (env.lookup ("query")).toBe (expected);
  // });

  // test ("move sql to query", () => {
  //   const env = new Environment ({
  //     query: "select json_build_object('id', id, 'birthday', cast(",
  //     sql: "birthday as text"
  //   }, null);

  //   env.moveSQLToQuery ();

  //   env.writeToQuery (") from team");

  //   expect (env).toEqual (new Environment ({
  //     query: "select json_build_object('id', id, 'birthday', cast(birthday as text) from team",
  //     sql: ""
  //   }, null));
  // });

  // test ("write sql to query", () => {
  //   const env = new Environment ({
  //     query: "select json_build_object('id', id) from team where id = 1",
  //     sql: "where last_name = 'Lee'"
  //   }, null);

  //   env.writeSQLToQuery (true);

  //   expect (env).toEqual (new Environment ({
  //     query: "select json_build_object('id', id) from team where id = 1 and last_name = 'Lee'",
  //     sql: "where last_name = 'Lee'"
  //   }, null));

  //   const env2 = new Environment ({
  //     query: "select json_build_object('id', id) from team",
  //     sql: "and last_name = 'Lee'"
  //   }, null);

  //   env2.writeSQLToQuery (false);

  //   expect (env2).toEqual (new Environment ({
  //     query: "select json_build_object('id', id) from team where last_name = 'Lee'",
  //     sql: "and last_name = 'Lee'"
  //   }, null));

  //   const env3 = new Environment ({
  //     query: "select json_build_object('id', id) from team",
  //     sql: "or last_name = 'Lee'"
  //   }, null);

  //   env3.writeSQLToQuery (false);

  //   expect (env3).toEqual (new Environment ({
  //     query: "select json_build_object('id', id) from team where last_name = 'Lee'",
  //     sql: "or last_name = 'Lee'"
  //   }, null));
  // });
});