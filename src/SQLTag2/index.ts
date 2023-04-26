import { flConcat, refqlType } from "../common/consts";
import isEmptyTag from "../common/isEmptyTag";
import { ConvertPromise, Querier, Runnable, StringMap, TagFunctionVariable } from "../common/types";
import unimplemented from "../common/unimplemented";
import { ASTNode, Raw, When } from "../nodes";
import Table from "../Table";

type InterpretedString<Params> = {
  pred: TagFunctionVariable<Params, any, boolean>;
  run: (params: Params, idx: number, table?: Table<any>) => [string, number];
};

type InterpretedValue<Params> = {
  pred: TagFunctionVariable<Params, any, boolean>;
  run: TagFunctionVariable<Params, any>;
};

interface InterpretedSQLTag<Params> {
  strings: InterpretedString<Params>[];
  values: InterpretedValue<Params>[];
}

export interface SQLTag2<Params = any, Output = any> {
  (params: Params, querier?: Querier): Promise<Output>;
  params: Params;
  nodes: ASTNode<Params, Output, any>[];
  interpreted?: InterpretedSQLTag<Params>;
  defaultQuerier?: Querier;
  convertPromise: (p: Promise<Output>) => any;
  concat<Params2, Output2>(other: SQLTag2<Params2, Output2>): SQLTag2<Params & Params2, Output & Output2>;
  join<Params2, Output2>(delimiter: string, other: SQLTag2<Params2, Output2>): SQLTag2<Params & Params2, Output & Output2>;
  [flConcat]: SQLTag2<Params, Output>["concat"];
  interpret(): InterpretedSQLTag<Params>;
  compile(params: Params, table?: Table<any>): [string, any[]];
}

const type = "refql/SQLTag2";

let prototype = {
  [refqlType]: type,
  constructor: SQLTag2,
  concat,
  join,
  [flConcat]: concat,
  interpret,
  compile,
  convertPromise: <T>(p: Promise<T>) => p
};

function SQLTag2<Params, Output>(nodes: ASTNode<Params, Output, any>[], defaultQuerier?: Querier) {

  const tag = ((params: Params = {} as Params, querier?: Querier) => {
    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }

    const [query, values] = tag.compile (params);

    return tag.convertPromise ((querier || defaultQuerier as Querier) (query, values) as Promise<Output>);
  }) as SQLTag2<Params, Output>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      nodes,
      defaultQuerier
    })
  );

  return tag;
}

function join<Params, Output>(this: SQLTag2<Params, Output>, delimiter: string, other: SQLTag2<Params, Output>) {
  if (isEmptyTag (this)) return other;
  if (isEmptyTag (other)) return this;

  return SQLTag2 (
    this.nodes.concat (Raw<Params, Output, any> (delimiter), ...other.nodes),
    this.defaultQuerier
  );
}

function concat<Params, Output>(this: SQLTag2<Params, Output>, other: SQLTag2<Params, Output>) {
  return this.join (" ", other);
}

const unsupported = unimplemented ("SQLTag2");

const truePred = () => true;

function interpret<Params, Output>(this: SQLTag2<Params, Output>): InterpretedSQLTag<Params> {
  const strings = [] as InterpretedString<Params>[],
    values = [] as InterpretedValue<Params>[];

  for (const [idx, node] of this.nodes.entries ()) {
    node.caseOf<void> ({
      Raw: run => {
        const nextNode = this.nodes[idx + 1];
        strings.push ({
          pred: truePred,
          run: (p, _i, t) => {
            let s = run (p, t);
            if (When.isWhen<Params, Output, any> (nextNode) && !nextNode.pred (p, t)) {
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
          pred: (p: Params, t?: Table<any>) => pred2 (p, t) && pred (p, t),
          run
        })));

        values.push (...values2.map (({ run, pred }) => ({
          pred: (p: Params, t?: Table<any>) => pred2 (p, t) && pred (p, t),
          run
        })));
      }
    });
  }

  return { strings, values };
}

function compile<Params, Output>(this: SQLTag2<Params, Output>, params: Params, table?: Table<any>) {
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
      .map (({ run }) => run (params, table)).flat (1)
  ];
}

export const setConvertPromise = (f: <T>(p: Promise<T>) => any) => {
  prototype.convertPromise = f;
};

export const isSQLTag = function <Params, Output> (x: any): x is SQLTag2<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default SQLTag2;