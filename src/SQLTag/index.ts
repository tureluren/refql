import { flConcat, flEmpty, flMap, refqlType } from "../common/consts";
import { TagFunctionVariable, Querier } from "../common/types";
import { ASTNode } from "../nodes";
import Table from "../Table";
import sql from "./sql";

interface InterpretedSQLTag<Params> {
  params: TagFunctionVariable<Params>[];
  strings: TagFunctionVariable<Params>[];
}

interface SQLTag<Params, Output> {
  nodes: ASTNode<Params>[];
  interpreted?: InterpretedSQLTag<Params>;
  concat<Params2, Output2>(other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
  map<Params2, Output2>(f: (values: ASTNode<Params>[]) => ASTNode<Params2>[]): SQLTag<Params2, Output2>;
  interpret(): InterpretedSQLTag<Params>;
  compile(params?: Params, paramIdx?: number, table?: Table): [string, any[]];
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
  run, compile, interpret
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

function interpret(this: SQLTag<unknown, unknown>): InterpretedSQLTag<unknown> {
  const params = [] as ((p: unknown, t?: Table) => any)[];
  const strings = [] as ((p: unknown, idx: number, t?: Table) => [string, number])[];

  for (const node of this.nodes) {
    node.caseOf<unknown> ({
      Raw: run => {
        strings.push ((p, _idx, t) => [run (p, t), 0]);
      },
      Value: run => {
        params.push (p => [run (p)]);
        strings.push ((_p, idx) => [`$${idx + 1}`, 1]);
      },
      Values: run => {
        params.push (p => run (p));
        strings.push ((p, idx) => {
          const values = run (p);
          return [
            `(${values.map ((_x, i) => `$${idx + i + 1}`).join (", ")})`,
            values.length
          ];
        });
      },
      Values2D: run => {
        params.push (p => run (p).flat (1));
        strings.push ((p, idx) => {
          const values2D = run (p);
          let n = 0;
          const s = [];

          for (const values of values2D) {
            s.push (
              `(${values.map (() => { n += 1; return `$${idx + n}`; }).join (", ")})`
            );
          }

          return [s.join (", "), n];
        });
      }
    });
  }

  return { params, strings };
}

function compile(this: SQLTag<unknown, unknown>, data: unknown = {}, paramIdx: number = 0, table?: Table) {
  if (!this.interpreted) {
    this.interpreted = this.interpret ();
  }
  const { strings, params } = this.interpreted;

  return [
    strings.reduce (([query, idx]: [string, number], f): [string, number] => {
      const [s, n] = f (data, idx, table);
      return [`${query} ${s}`.trim (), idx + n];
    }, ["", paramIdx])[0],
    params.map (f => f (data)).flat (1)
  ];
}

function run(this: SQLTag<unknown, unknown>, querier: Querier, data: unknown = {}) {
  return new Promise ((res, rej) => {
    let query, values;
    try {
      [query, values] = this.compile (data, 0);
    } catch (err: any) {
      rej (err);
      return;
    }


    querier (
      query, values
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