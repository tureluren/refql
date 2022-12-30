import { flConcat, flEmpty, flMap, refqlType } from "../common/consts";
import isEmptyTag from "../common/isEmptyTag";
import { Querier, TagFunctionVariable } from "../common/types";
import unimplemented from "../common/unimplemented";
import { ASTNode, Raw, When } from "../nodes";
import Table from "../Table";
import sql from "./sql";

type InterpretedString<Params> = {
  pred: TagFunctionVariable<Params, boolean>;
  run: (params: Params, idx: number, table?: Table) => [string, number];
};

type InterpretedValue<Params> = {
  pred: TagFunctionVariable<Params, boolean>;
  run: TagFunctionVariable<Params>;
};

interface InterpretedSQLTag<Params> {
  strings: InterpretedString<Params>[];
  values: InterpretedValue<Params>[];
}

interface SQLTag<Params> {
  nodes: ASTNode<Params>[];
  interpreted?: InterpretedSQLTag<Params>;
  concat<Params2>(other: SQLTag<Params2>): SQLTag<Params & Params2>;
  join<Params2>(delimiter: string, other: SQLTag<Params2>): SQLTag<Params & Params2>;
  [flConcat]: SQLTag<Params>["concat"];
  map<Params2>(f: (nodes: ASTNode<Params>[]) => ASTNode<Params2>[]): SQLTag<Params2>;
  [flMap]: SQLTag<Params>["map"];
  interpret(): InterpretedSQLTag<Params>;
  compile(params?: Params, table?: Table): [string, any[]];
  run<Output>(querier: Querier, params?: Params): Promise<Output[]>;
}

const type = "refql/SQLTag";

const prototype = {
  [refqlType]: type,
  constructor: SQLTag,
  concat,
  join,
  [flConcat]: concat,
  map,
  [flMap]: map,
  interpret,
  compile,
  run
};

function SQLTag<Params>(nodes: ASTNode<Params>[]) {
  let tag: SQLTag<Params> = Object.create (prototype);
  tag.nodes = nodes;

  return tag;
}

function join(this: SQLTag<unknown>, delimiter: string, other: SQLTag<unknown>) {
  if (isEmptyTag (this)) return other;
  if (isEmptyTag (other)) return this;

  return SQLTag (this.nodes.concat (Raw (delimiter), ...other.nodes));
}

function concat(this: SQLTag<unknown>, other: SQLTag<unknown>) {
  return this.join (" ", other);
}

function map(this: SQLTag<unknown>, f: (nodes: ASTNode<unknown>[]) => ASTNode<unknown>[]) {
  return SQLTag<unknown> (f (this.nodes));
}

const unsupported = unimplemented ("SQLTag");

const truePred = () => true;

function interpret(this: SQLTag<unknown>): InterpretedSQLTag<unknown> {
  const strings = [] as InterpretedString<unknown>[],
    values = [] as InterpretedValue<unknown>[];

  for (const [idx, node] of this.nodes.entries ()) {
    node.caseOf<void> ({
      Raw: run => {
        const nextNode = this.nodes[idx + 1];
        strings.push ({
          pred: truePred,
          run: (p, _i, t) => {
            let s = run (p, t);
            if (When.isWhen (nextNode) && !nextNode.pred (p, t)) {
              s = s.trimEnd ();
            }
            return [s, 0];
          }
        });
      },
      Value: run => {
        values.push ({
          pred: truePred,
          run: (p, t) => [run (p, t)]
        });
        strings.push ({
          pred: truePred,
          run: (_p, i) => [`$${i + 1}`, 1]
        });
      },
      Values: run => {
        values.push ({
          pred: truePred,
          run
        });

        strings.push ({
          pred: truePred,
          run: (p, i) => {
            const xs = run (p);
            return [
              `(${xs.map ((_x, j) => `$${i + j + 1}`).join (", ")})`,
              xs.length
            ];
          }
        });
      },
      Values2D: run => {
        values.push ({
          pred: truePred,
          run: p => run (p).flat (1)
        });

        strings.push ({
          pred: truePred,
          run: (p, i) => {
            const values2D = run (p),
              s = [];

            let n = 0;

            for (const values of values2D) {
              s.push (
                `(${values.map (() => { n += 1; return `$${i + n}`; }).join (", ")})`
              );
            }

            return [s.join (", "), n];
          }
        });
      },
      When: (pred2, tag) => {
        const { strings: strings2, values: values2 } = tag.interpret ();

        strings.push (...strings2.map (({ run, pred }) => ({
          pred: (p: unknown, t?: Table) => pred2 (p, t) && pred (p, t),
          run
        })));

        values.push (...values2.map (({ run, pred }) => ({
          pred: (p: unknown, t?: Table) => pred2 (p, t) && pred (p, t),
          run
        })));
      },
      Identifier: unsupported ("Identifier"),
      RefNode: unsupported ("RefNode"),
      BelongsToMany: unsupported ("BelongsToMany"),
      All: unsupported ("All"),
      Variable: unsupported ("Variable"),
      Call: unsupported ("Call"),
      Literal: unsupported ("Literal"),
      StringLiteral: unsupported ("StringLiteral")
    });
  }

  return { strings, values };
}

function compile(this: SQLTag<unknown>, params: unknown, table?: Table) {
  if (!this.interpreted) {
    this.interpreted = this.interpret ();
  }

  const { strings, values } = this.interpreted;

  return [
    strings
      .filter (({ pred }) => pred (params, table))
      .reduce (([query, idx]: [string, number], { run }): [string, number] => {
        const [s, n] = run (params, idx, table);

        return [query.concat (s), idx + n];
      }, ["", 0])[0],

    values
      .filter (({ pred }) => pred (params, table))
      .map (({ run }) => run (params, table as Table)).flat (1)
  ];
}

async function run(this: SQLTag<unknown>, querier: Querier, params: unknown) {
  const [query, values] = this.compile (params);

  return querier (query, values);
}

SQLTag.empty = SQLTag[flEmpty] = function () {
  return sql``;
} as <Params>() => SQLTag<Params>;

SQLTag.isSQLTag = function <Params> (value: any): value is SQLTag<Params> {
  return value != null && value[refqlType] === type;
};

export default SQLTag;