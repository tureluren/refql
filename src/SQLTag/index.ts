import { flConcat, refqlType } from "../common/consts";
import { getConvertPromise } from "../common/convertPromise";
import getGlobalQuerier from "../common/defaultQuerier";
import isEmptyTag from "../common/isEmptyTag";
import { Querier, Simplify, StringMap, TagFunctionVariable } from "../common/types";
import rawSpace from "../RQLTag/RawSpace";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import Raw from "./Raw";
import SQLNode from "./SQLNode";
import Value from "./Value";
import Values from "./Values";
import Values2D from "./Values2D";

type InterpretedSQLTagString<Params = any> = {
  run: (params: Params, idx: number) => [string, number];
};

type InterpretedSQLTagValue<Params = any> = {
  run: TagFunctionVariable<Params>;
};

interface InterpretedSQLTag<Params = any> {
  strings: InterpretedSQLTagString<Params>[];
  values: InterpretedSQLTagValue<Params>[];
}

export interface SQLTag<Params = any, Output = any> extends RQLNode {
  (params: {} extends Params ? Params | void : Params, querier?: Querier): Promise<Output[]>;
  params: Params;
  nodes: SQLNode<Params>[];
  interpreted?: InterpretedSQLTag<Params>;
  defaultQuerier?: Querier;
  concat<Params2, Output2>(other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
  join<Params2, Output2>(delimiter: Raw | string, other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
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
  compile
});

export function createSQLTag<Params = {}, Output = any>(nodes: SQLNode<Params>[]) {
  const tag = ((params = {} as Params, querier?) => {
    const defaultQuerier = getGlobalQuerier ();
    const convertPromise = getConvertPromise ();

    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }

    const [query, values] = tag.compile (params as any);

    return convertPromise ((querier || defaultQuerier as Querier) (query, values) as Promise<Output[]>);
  }) as SQLTag<Params, Output>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      nodes
    })
  );

  return tag;
}

function join(this: SQLTag, delimiter: Raw | string, other: SQLTag) {
  const raw = Raw.isRaw (delimiter) ? delimiter : Raw (delimiter);

  return createSQLTag (
    this.nodes.concat (raw, ...other.nodes)
  );
}

function concat(this: SQLTag, other: SQLTag) {
  if (isEmptyTag (this)) return other;
  if (isEmptyTag (other)) return this;

  return this.join (rawSpace (), other);
}

function interpret(this: SQLTag): InterpretedSQLTag {
  const strings = [] as InterpretedSQLTagString[],
    values = [] as InterpretedSQLTagValue[];

  for (const node of this.nodes) {
    const { pred, run } = node;
    if (Raw.isRaw (node)) {
      // move run 1ne hoger en definier on SQL node

      strings.push ({
        run: (p, _i) => {
          const pr = pred (p);
          if (!pr) return ["", 0];

          let s = run (p);
          return [s, 0];
        }
      });
    } else if (Value.isValue (node)) {

      values.push ({
        run: p => {
          const pr = pred (p);
          if (!pr) return [];

          return [run (p)];
        }
      });

      strings.push ({
        run: (p, i) => {
          const pr = pred (p);
          if (!pr) return ["", 0];

          return [`$${i + 1}`, 1];
        }
      });
    } else if (Values.isValues (node)) {

      values.push ({
        run: p => {
          const pr = pred (p);
          if (!pr) return [];

          return run (p);
        }
      });

      strings.push ({
        run: (p, i) => {
          const pr = pred (p);
          if (!pr) return ["", 0];

          const xs = run (p);
          return [
            `(${xs.map ((_x: any, j: number) => `$${i + j + 1}`).join (", ")})`,
            xs.length
          ];
        }
      });
    } else if (Values2D.isValues2D (node)) {
      const { run } = node;

      values.push ({
        run: p => run (p).flat (1).filter (p => !Raw.isRaw (p))
      });

      strings.push ({
        run: (p, i) => {
          const values2D = run (p),
            s = [];

          let n = 0;

          for (const values of values2D) {
            s.push (
              `(${values.map (v => {
                if (Raw.isRaw (v)) {
                  return v.run (p);
                } else {
                  n += 1;
                  return `$${i + n}`;
                }
              }).join (", ")})`
            );
          }

          return [s.join (", "), n];
        }
      });
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

  let query = strings
    .reduce (([query, idx]: [string, number], { run }): [string, number] => {
      const [s, n] = run (params, idx);

      return [query.concat (s), idx + n];
    }, ["", 0])[0];

  return [
    query,
    values
      .map (({ run }) => run (params)).flat (1)
  ];
}

export const isSQLTag = function <Params = any, Output = any> (x: any): x is SQLTag<Params, Output> {
  return x != null && x[refqlType] === type;
};