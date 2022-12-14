import { flConcat, flEmpty, flMap, refqlType } from "../common/consts";
import { TagFunctionVariable, Querier } from "../common/types";
import { ASTNode } from "../nodes";
import Table from "../Table";
import formatSQLString from "./formatSQLString";
import sql from "./sql";

type StringFunction <Params> = (params: Params, idx: number, table?: Table) => [string, number];

interface InterpretedSQLTag<Params> {
  strings: StringFunction<Params>[];
  values: TagFunctionVariable<Params>[];
}

interface SQLTag<Params, Output, InRQL extends boolean = false> {
  nodes: ASTNode<Params>[];
  interpreted?: InterpretedSQLTag<Params>;
  concat<Params2, Output2>(other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
  [flConcat]: SQLTag<Params, Output>["concat"];
  map<Params2, Output2>(f: (values: ASTNode<Params>[]) => ASTNode<Params2>[]): SQLTag<Params2, Output2>;
  [flMap]: SQLTag<Params, Output>["map"];
  interpret(): InterpretedSQLTag<Params>;
  compile(params?: Params, table?: Table): [string, any[]];
  run(querier: Querier, params?: Params): Promise<Output[]>;
}

const type = "refql/SQLTag";

const prototype = {
  [refqlType]: type,
  constructor: SQLTag,
  concat,
  [flConcat]: concat,
  map,
  [flMap]: map,
  interpret,
  compile,
  run
};

function SQLTag<Params, Output, InRQL extends boolean = false>(nodes: ASTNode<Params>[]) {
  let tag: SQLTag<Params, Output, InRQL> = Object.create (prototype);
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
  const strings = [] as StringFunction<unknown>[];
  const values = [] as TagFunctionVariable<unknown>[];

  for (const node of this.nodes) {
    node.caseOf<unknown> ({
      Raw: run => {
        strings.push ((p, _i, t) => [run (p, t), 0]);
      },
      Value: run => {
        values.push ((p, t) => [run (p, t)]);
        strings.push ((_p, i) => [`$${i + 1}`, 1]);
      },
      Values: run => {
        values.push (run);

        strings.push ((p, i) => {
          const xs = run (p);
          return [
            `(${xs.map ((_x, j) => `$${i + j + 1}`).join (", ")})`,
            xs.length
          ];
        });
      },
      Values2D: run => {
        values.push (p => run (p).flat (1));

        strings.push ((p, i) => {
          const values2D = run (p);
          let n = 0;
          const s = [];

          for (const values of values2D) {
            s.push (
              `(${values.map (() => { n += 1; return `$${i + n}`; }).join (", ")})`
            );
          }

          return [s.join (", "), n];
        });
      }
    });
  }

  return { strings, values };
}

function compile(this: SQLTag<unknown, unknown>, params: unknown = {}, table?: Table) {
  if (!this.interpreted) {
    this.interpreted = this.interpret ();
  }

  const { strings, values } = this.interpreted;

  return [
    formatSQLString (
      strings.reduce (([query, idx]: [string, number], f): [string, number] => {
        const [s, n] = f (params, idx, table);

        return [`${query} ${s}`, idx + n];
      }, ["", 0])[0]
    ),

    values.map (f => f (params)).flat (1)
  ];
}

function run(this: SQLTag<unknown, unknown>, querier: Querier, params: unknown = {}) {
  return new Promise ((res, rej) => {
    let query, values;
    try {
      [query, values] = this.compile (params);
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

SQLTag.isSQLTag = function <Params, Output> (value: any): value is SQLTag<Params, Output> {
  return value != null && value[refqlType] === type;
};

export default SQLTag;