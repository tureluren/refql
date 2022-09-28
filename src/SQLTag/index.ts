import { flConcat, flMap, refqlType } from "../common/consts";
import { Querier, StringMap } from "../common/types";
import { Variable } from "../nodes";
import compileSQLTag from "./compileSQLTag";

interface SQLTag<Params> {
  values: (string | Variable<Params>)[];
  concat<Params2>(other: SQLTag<Params2>): SQLTag<Params & Params2>;
  map<Params2>(f: (values: (string | Variable<Params>)[]) => (string | Variable<Params2>)[]): SQLTag<Params2>;
  run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]>;
  [flConcat]: SQLTag<Params>["concat"];
  [flMap]: SQLTag<Params>["map"];
}

const sqlTagType = "refql/SQLTag";

const prototype = {
  constructor: SQLTag,
  [refqlType]: sqlTagType,
  concat, [flConcat]: concat,
  map, [flMap]: map, run
};

function SQLTag<Params>(values: (string | Variable<Params>)[]) {
  let tag: SQLTag<Params> = Object.create (prototype);
  tag.values = values;

  return tag;
}

function concat(this: SQLTag<unknown>, other: SQLTag<unknown>) {
  return SQLTag (this.values.concat (other.values));
}

function map(this: SQLTag<unknown>, f: (values: (string | Variable<unknown>)[]) => (string | Variable<unknown>)[]) {
  return SQLTag<unknown> (f (this.values));
}

function run(this: SQLTag<unknown>, querier: Querier<StringMap>, params: unknown = {}) {
  return new Promise ((res, rej) => {
    let query, values;

    try {
      [query, values] = compileSQLTag (this, 0, params);
    } catch (err: any) {
      rej (err);
      return;
    }

    querier (query, values).then (res).catch (rej);
  });
}

SQLTag.isSQLTag = function <Params> (value: any): value is SQLTag<Params> {
  return value != null && value[refqlType] === sqlTagType;
};

export default SQLTag;