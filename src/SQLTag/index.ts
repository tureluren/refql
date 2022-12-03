import { flConcat, flEmpty, flMap, refqlType } from "../common/consts";
import { ParamF2, Querier } from "../common/types";
import { ASTNode } from "../nodes";
import compileSQLTag from "./compileSQLTag";
import sql from "./sql";

interface CompiledSQLTag<Input> {
  params: ParamF2<Input>[];
  strings: ParamF2<Input>[];
}

interface SQLTag<Input, Output> {
  nodes: ASTNode<Input>[];
  compiled?: CompiledSQLTag<Input>;
  concat<Input2, Output2>(other: SQLTag<Input2, Output2>): SQLTag<Input & Input2, Output & Output2>;
  map<Input2, Output2>(f: (values: ASTNode<Input>[]) => ASTNode<Input2>[]): SQLTag<Input2, Output2>;
  compile(paramsIdx?: number): CompiledSQLTag<Input>;
  run(querier: Querier, params?: Input): Promise<Output[]>;
  [flConcat]: SQLTag<Input, Output>["concat"];
  [flMap]: SQLTag<Input, Output>["map"];
}

const type = "refql/SQLTag";

const prototype = {
  constructor: SQLTag,
  [refqlType]: type,
  concat, [flConcat]: concat,
  map, [flMap]: map,
  run, compile
};

function SQLTag<Input, Output>(nodes: ASTNode<Input>[]) {
  let tag: SQLTag<Input, Output> = Object.create (prototype);
  tag.nodes = nodes;

  return tag;
}

function concat(this: SQLTag<unknown, unknown>, other: SQLTag<unknown, unknown>) {
  return SQLTag (this.nodes.concat (other.nodes));
}

function map(this: SQLTag<unknown, unknown>, f: (nodes: ASTNode<unknown>[]) => ASTNode<unknown>[]) {
  return SQLTag<unknown, unknown> (f (this.nodes));
}

function compile(this: SQLTag<unknown, unknown>): CompiledSQLTag<unknown> {
  const params = [] as ParamF2<unknown>[];
  const strings = [] as ParamF2<unknown>[];

  for (const node of this.nodes) {
    node.caseOf<unknown> ({
      Raw: run => {
        strings.push ((p, t) => String (run (p, t)));
      },
      Param: f => {
        params.push (f);
        strings.push (() => "?");
      },
      List: run => {

      }
      // Table
      // In

    });
  }

  return { params, strings };
}

function run(this: SQLTag<unknown, unknown>, querier: Querier, data: unknown = {}) {
  return new Promise ((res, rej) => {
    try {
      if (!this.compiled) {
        this.compiled = this.compile ();
      }
    } catch (err: any) {
      rej (err);
      return;
    }

    const { strings, params } = this.compiled;

    querier (
      strings.map (f => f (data)).join (" "),
      params.map (f => f (data))
    ).then (res).catch (rej);
  });
}

SQLTag.empty = SQLTag[flEmpty] = function () {
  return sql``;
} as () => SQLTag<unknown, unknown>;

SQLTag.isSQLTag = function <Input, Output> (value: any): value is SQLTag<Input, Output> {
  return value != null && value[refqlType] === type;
};

export default SQLTag;