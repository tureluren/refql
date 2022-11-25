import { flConcat, flEmpty, flMap, refqlType } from "../common/consts";
import { Querier, StringMap } from "../common/types";
import { Variable } from "../nodes";
import compileSQLTag from "./compileSQLTag";
import sql from "./sql";

interface SQLTag<Input, Output> {
  values: (string | Variable<Input>)[];
  concat<Input2, Output2>(other: SQLTag<Input2, Output2>): SQLTag<Input & Input2, Output & Output2>;
  map<Input2, Output2>(f: (values: (string | Variable<Input>)[]) => (string | Variable<Input2>)[]): SQLTag<Input2, Output2>;
  run(querier: Querier, params?: Input): Promise<Output[]>;
  [flConcat]: SQLTag<Input, Output>["concat"];
  [flMap]: SQLTag<Input, Output>["map"];
}

const sqlTagType = "refql/SQLTag";

const prototype = {
  constructor: SQLTag,
  [refqlType]: sqlTagType,
  concat, [flConcat]: concat,
  map, [flMap]: map, run
};

function SQLTag<Input, Output>(values: (string | Variable<Input>)[]) {
  let tag: SQLTag<Input, Output> = Object.create (prototype);
  tag.values = values;

  return tag;
}

function concat(this: SQLTag<unknown, unknown>, other: SQLTag<unknown, unknown>) {
  return SQLTag (this.values.concat (other.values));
}

function map(this: SQLTag<unknown, unknown>, f: (values: (string | Variable<unknown>)[]) => (string | Variable<unknown>)[]) {
  return SQLTag<unknown, unknown> (f (this.values));
}

function run(this: SQLTag<unknown, unknown>, querier: Querier, params?: unknown) {
  return new Promise ((res, rej) => {
    let query, values;

    try {
      [query, values] = compileSQLTag (this, 0, params || {});
    } catch (err: any) {
      rej (err);
      return;
    }

    querier (query, values).then (res).catch (rej);
  });
}

SQLTag.empty = SQLTag[flEmpty] = function () {
  return sql``;
} as () => SQLTag<unknown, unknown>;

SQLTag.isSQLTag = function <Input, Output> (value: any): value is SQLTag<Input, Output> {
  return value != null && value[refqlType] === sqlTagType;
};

export default SQLTag;