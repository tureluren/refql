import { flConcat, flEmpty, flMap, refqlType } from "../common/consts";
import { TagFunctionVariable, Querier } from "../common/types";
import { ASTNode } from "../nodes";
import sql from "./sql";

interface CompiledSQLTag<Params> {
  params: TagFunctionVariable<Params>[];
  strings: TagFunctionVariable<Params>[];
}

interface SQLTag<Params, Output> {
  nodes: ASTNode<Params>[];
  compiled?: CompiledSQLTag<Params>;
  concat<Params2, Output2>(other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
  map<Params2, Output2>(f: (values: ASTNode<Params>[]) => ASTNode<Params2>[]): SQLTag<Params2, Output2>;
  compile(paramsIdx?: number): CompiledSQLTag<Params>;
  run(querier: Querier, params?: Params): Promise<Output[]>;
  [flConcat]: SQLTag<Params, Output>["concat"];
  [flMap]: SQLTag<Params, Output>["map"];
}

const type = "refql/SQLTag";

const prototype = {
  constructor: SQLTag,
  [refqlType]: type,
  concat, [flConcat]: concat,
  map, [flMap]: map,
  run, compile
};

function SQLTag<Params, Output>(nodes: ASTNode<Params>[]) {
  let tag: SQLTag<Params, Output> = Object.create (prototype);
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
  const params = [] as TagFunctionVariable<unknown>[];
  const strings = [] as TagFunctionVariable<unknown>[];

  for (const node of this.nodes) {
    node.caseOf<unknown> ({
      Raw: run => {
        strings.push ((p, t) => String (run (p, t)));
      },
      Value: run => {
        params.push (run);
        strings.push (() => "?");
      },
      Values: run => {
        params.push (run);
        strings.push (p => `(${run (p).map (_ => "?").join (", ")})`);
      }
      // Table

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
      params.map (f => f (data)).flat ()
    ).then (res).catch (rej);
  });
}

SQLTag.empty = SQLTag[flEmpty] = function () {
  return sql``;
} as () => SQLTag<unknown, unknown>;

SQLTag.isSQLTag = function <Params, Output> (value: any): value is SQLTag<Params, Output> {
  return value != null && value[refqlType] === type;
};

export default SQLTag;