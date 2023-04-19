import { Boxes } from "../common/BoxRegistry";
import { flConcat, refqlType } from "../common/consts";
import isEmptyTag from "../common/isEmptyTag";
import { ConvertPromise, Querier, Runnable, StringMap, TagFunctionVariable } from "../common/types";
import unimplemented from "../common/unimplemented";
import { ASTNode, Raw, When } from "../nodes";
import Table from "../Table";

type InterpretedString<Params, Box extends Boxes> = {
  pred: TagFunctionVariable<Params, Box, boolean>;
  run: (params: Params, idx: number, table?: Table<Box>) => [string, number];
};

type InterpretedValue<Params, Box extends Boxes> = {
  pred: TagFunctionVariable<Params, Box, boolean>;
  run: TagFunctionVariable<Params, Box>;
};

interface InterpretedSQLTag<Params, Box extends Boxes> {
  strings: InterpretedString<Params, Box>[];
  values: InterpretedValue<Params, Box>[];
}

interface SQLTag2<Params = any, Output = any, Box extends Boxes = "Promise"> {
  params: Params;
  nodes: ASTNode<Params, Output, Box>[];
  interpreted?: InterpretedSQLTag<Params, Box>;
  defaultQuerier?: Querier;
  convertPromise?: ConvertPromise<Box, Output>;
  concat<Params2, Output2, Box2 extends Boxes>(other: SQLTag2<Params2, Output2, Box2>): SQLTag2<Params & Params2, Output & Output2, Box> & Runnable<Params & Params2, ReturnType<ConvertPromise<Box, Output & Output2>>>;
  join<Params2, Output2>(delimiter: string, other: SQLTag2<Params2, Output2, Box>): SQLTag2<Params & Params2, Output & Output2, Box> & Runnable<Params & Params2, ReturnType<ConvertPromise<Box, Output & Output2>>>;
  [flConcat]: SQLTag2<Params, Output, Box>["concat"];
  interpret(): InterpretedSQLTag<Params, Box>;
  compile(params: Params, table?: Table<Box>): [string, any[]];
}

const type = "refql/SQLTag2";

const prototype = {
  [refqlType]: type,
  constructor: SQLTag2,
  concat,
  join,
  [flConcat]: concat,
  interpret,
  compile
};

function SQLTag2<Params, Output, Box extends Boxes>(nodes: ASTNode<Params, Output, Box>[], defaultQuerier?: Querier, convertPromise?: ConvertPromise<Box, Output>) {
  const convert = convertPromise || (x => x);

  const tag = ((params: Params = {} as Params, querier?: Querier) => {
    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }

    const [query, values] = tag.compile (params);

    return convert ((querier || defaultQuerier as Querier) (query, values) as Promise<Output>);
  }) as SQLTag2<Params, Output, Box> & Runnable<Params, ReturnType<ConvertPromise<Box, Output>>>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      nodes,
      defaultQuerier,
      convertPromise
    })
  );

  return tag;
}

function join<Params, Output, Box extends Boxes>(this: SQLTag2<Params, Output, Box>, delimiter: string, other: SQLTag2<Params, Output, Box>) {
  if (isEmptyTag (this)) return other;
  if (isEmptyTag (other)) return this;

  return SQLTag2 (
    this.nodes.concat (Raw<Params, Output, Box> (delimiter), ...other.nodes),
    this.defaultQuerier,
    this.convertPromise
  );
}

function concat<Params, Output, Box extends Boxes>(this: SQLTag2<Params, Output, Box>, other: SQLTag2<Params, Output, Box>) {
  return this.join (" ", other);
}

const unsupported = unimplemented ("SQLTag2");

const truePred = () => true;

function interpret<Params, Output, Box extends Boxes>(this: SQLTag2<Params, Output, Box>): InterpretedSQLTag<Params, Box> {
  const strings = [] as InterpretedString<Params, Box>[],
    values = [] as InterpretedValue<Params, Box>[];

  for (const [idx, node] of this.nodes.entries ()) {
    node.caseOf<void> ({
      Raw: run => {
        const nextNode = this.nodes[idx + 1];
        strings.push ({
          pred: truePred,
          run: (p, _i, t) => {
            let s = run (p, t);
            if (When.isWhen<Params, Output, Box> (nextNode) && !nextNode.pred (p, t)) {
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
          pred: (p: Params, t?: Table<Box>) => pred2 (p, t) && pred (p, t),
          run
        })));

        values.push (...values2.map (({ run, pred }) => ({
          pred: (p: Params, t?: Table<Box>) => pred2 (p, t) && pred (p, t),
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

function compile<Params, Output, Box extends Boxes>(this: SQLTag2<Params, Output, Box>, params: Params, table?: Table<Box>) {
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

SQLTag2.isSQLTag = function <Params, Output, Box extends Boxes> (x: any): x is SQLTag2<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export default SQLTag2;