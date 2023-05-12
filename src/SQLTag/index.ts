import { flConcat, refqlType } from "../common/consts";
import isEmptyTag from "../common/isEmptyTag";
import { Querier, SQLNode, TagFunctionVariable } from "../common/types";
import When from "../common/When";
import { rqlNodePrototype } from "../RQLTag/isRQLNode";
import Raw from "./Raw";
import Value from "./Value";
import Values from "./Values";
import Values2D from "./Values2D";

type InterpretedString<Params> = {
  pred: TagFunctionVariable<Params, boolean>;
  run: (params: Params, idx: number) => [string, number];
};

type InterpretedValue<Params> = {
  pred: TagFunctionVariable<Params, boolean>;
  run: TagFunctionVariable<Params>;
};

interface InterpretedSQLTag<Params> {
  strings: InterpretedString<Params>[];
  values: InterpretedValue<Params>[];
}

export interface SQLTag<Params = any, Output = any> {
  (params?: Params, querier?: Querier): Promise<Output>;
  params: Params;
  nodes: SQLNode<Params>[];
  interpreted?: InterpretedSQLTag<Params>;
  defaultQuerier?: Querier;
  convertPromise: (p: Promise<Output>) => any;
  concat<Params2, Output2>(other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
  join<Params2, Output2>(delimiter: string, other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
  [flConcat]: SQLTag<Params, Output>["concat"];
  interpret(): InterpretedSQLTag<Params>;
  compile(params: Params): [string, any[]];
}

const type = "refql/SQLTag";

const prototype = Object.assign ({}, rqlNodePrototype, {
  [refqlType]: type,
  constructor: createSQLTag,
  concat,
  join,
  [flConcat]: concat,
  interpret,
  compile,
  convertPromise: <T>(p: Promise<T>) => p
});

export function createSQLTag<Params, Output>(nodes: SQLNode<Params>[], defaultQuerier?: Querier) {

  const tag = ((params = {} as Params, querier?) => {
    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }

    const [query, values] = tag.compile (params);

    return tag.convertPromise ((querier || defaultQuerier as Querier) (query, values) as Promise<Output>);
  }) as SQLTag<Params, Output>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      nodes,
      defaultQuerier
    })
  );

  return tag;
}

function join<Params, Output>(this: SQLTag<Params, Output>, delimiter: string, other: SQLTag<Params, Output>) {
  if (isEmptyTag (this)) return other;
  if (isEmptyTag (other)) return this;

  return createSQLTag (
    this.nodes.concat (Raw<Params> (delimiter), ...other.nodes),
    this.defaultQuerier
  );
}

function concat<Params, Output>(this: SQLTag<Params, Output>, other: SQLTag<Params, Output>) {
  return this.join (" ", other);
}

const truePred = () => true;

function interpret<Params, Output>(this: SQLTag<Params, Output>): InterpretedSQLTag<Params> {
  const strings = [] as InterpretedString<Params>[],
    values = [] as InterpretedValue<Params>[];

  for (const [idx, node] of this.nodes.entries ()) {
    if (Raw.isRaw (node)) {
      const { run } = node;
      const nextNode = this.nodes[idx + 1];

      strings.push ({
        pred: truePred,
        run: (p, _i) => {
          let s = run (p);
          if (When.isWhen<Params> (nextNode) && !nextNode.pred (p)) {
            s = s.trimEnd ();
          }
          return [s, 0];
        }
      });
    } else if (Value.isValue (node)) {
      const { run } = node;

      values.push ({
        pred: truePred,
        run: p => [run (p)]
      });
      strings.push ({
        pred: truePred,
        run: (_p, i) => [`$${i + 1}`, 1]
      });
    } else if (Values.isValues (node)) {
      const { run } = node;

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
    } else if (Values2D.isValues2D (node)) {
      const { run } = node;

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
    } else if (When.isWhen (node)) {
      const { pred: pred2, tag } = node;

      const { strings: strings2, values: values2 } = tag.interpret ();

      strings.push (...strings2.map (({ run, pred }) => ({
        pred: (p: Params) => pred2 (p) && pred (p),
        run
      })));

      values.push (...values2.map (({ run, pred }) => ({
        pred: (p: Params) => pred2 (p) && pred (p),
        run
      })));
    } else {
      throw new Error (`Unknown SQLNode Type: "${String (node)}"`);
    }
  }

  return { strings, values };
}

function compile<Params, Output>(this: SQLTag<Params, Output>, params: Params) {
  if (!this.interpreted) {
    this.interpreted = this.interpret ();
  }

  const { strings, values } = this.interpreted;

  return [
    strings
      .filter (({ pred }) => pred (params))
      .reduce (([query, idx]: [string, number], { run }): [string, number] => {
        const [s, n] = run (params, idx);

        return [query.concat (s), idx + n];
      }, ["", 0])[0],

    values
      .filter (({ pred }) => pred (params))
      .map (({ run }) => run (params)).flat (1)
  ];
}

export const convertSQLTagResult = (f: <T>(p: Promise<T>) => any) => {
  prototype.convertPromise = f;
};

export const isSQLTag = function <Params, Output> (x: any): x is SQLTag<Params, Output> {
  return x != null && x[refqlType] === type;
};