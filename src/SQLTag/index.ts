import { flConcat, refqlType } from "../common/consts";
import isEmptyTag from "../common/isEmptyTag";
import { Querier, StringMap, TagFunctionVariable } from "../common/types";
import When from "../common/When";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import Raw from "./Raw";
import SQLNode from "./SQLNode";
import Value from "./Value";
import Values from "./Values";
import Values2D from "./Values2D";

type InterpretedString<Params = any> = {
  pred: TagFunctionVariable<Params, boolean>;
  run: (params: Params, idx: number) => [string, number];
};

type InterpretedValue<Params = any> = {
  pred: TagFunctionVariable<Params, boolean>;
  run: TagFunctionVariable<Params>;
};

interface InterpretedSQLTag<Params = any> {
  strings: InterpretedString<Params>[];
  values: InterpretedValue<Params>[];
}

export interface SQLTag<Params = any, Output = any> extends RQLNode, SelectableType {
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

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  [refqlType]: type,
  constructor: createSQLTag,
  concat,
  join,
  [flConcat]: concat,
  interpret,
  compile,
  convertPromise: <T>(p: Promise<T>) => p
});

export function createSQLTag<Params, Output = any>(nodes: SQLNode<Params>[], defaultQuerier?: Querier) {

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

function join(this: SQLTag, delimiter: string, other: SQLTag) {
  if (isEmptyTag (this)) return other;
  if (isEmptyTag (other)) return this;

  return createSQLTag (
    this.nodes.concat (Raw (delimiter), ...other.nodes),
    this.defaultQuerier
  );
}

function concat(this: SQLTag, other: SQLTag) {
  return this.join (" ", other);
}

const truePred = () => true;

function interpret(this: SQLTag): InterpretedSQLTag {
  const strings = [] as InterpretedString[],
    values = [] as InterpretedValue[];

  for (const [idx, node] of this.nodes.entries ()) {
    if (Raw.isRaw (node)) {
      const { run } = node;
      const nextNode = this.nodes[idx + 1];

      strings.push ({
        pred: truePred,
        run: (p, _i) => {
          let s = run (p);
          if (When.isWhen (nextNode) && !nextNode.pred (p)) {
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
        pred: (p: StringMap) => pred2 (p) && pred (p),
        run
      })));

      values.push (...values2.map (({ run, pred }) => ({
        pred: (p: StringMap) => pred2 (p) && pred (p),
        run
      })));
    } else {
      throw new Error (`Unknown SQLNode Type: "${String (node)}"`);
    }
  }

  return { strings, values };
}

function compile(this: SQLTag, params: StringMap) {
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

export const isSQLTag = function <Params = any, Output = any> (x: any): x is SQLTag<Params, Output> {
  return x != null && x[refqlType] === type;
};