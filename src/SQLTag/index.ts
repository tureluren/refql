import { flConcat, refqlType } from "../common/consts";
import { getConvertPromise } from "../common/convertPromise";
import getGlobalQuerier from "../common/defaultQuerier";
import isEmptyTag from "../common/isEmptyTag";
import { Querier, StringMap, TagFunctionVariable } from "../common/types";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
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

export interface SQLTag<Params = any, Output = any> extends RQLNode, SelectableType {
  (params?: Params, querier?: Querier): Promise<Output>;
  params: Params;
  nodes: SQLNode<Params>[];
  interpreted?: InterpretedSQLTag<Params>;
  defaultQuerier?: Querier;
  concat<Params2, Output2>(other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
  join<Params2, Output2>(delimiter: string, other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
  [flConcat]: SQLTag<Params, Output>["concat"];
  interpret(): InterpretedSQLTag<Params>;
  compile(params: Params): [string, any[]];
  // WEG
  setPred (fn: (p: any) => boolean): SQLTag<Params, Output>;
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
  setPred,
  precedence: 1
});

export function createSQLTag<Params, Output = any>(nodes: SQLNode<Params>[]) {
  const tag = ((params = {} as Params, querier?) => {
    const defaultQuerier = getGlobalQuerier ();
    const convertPromise = getConvertPromise ();

    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }

    const [query, values] = tag.compile (params);

    return convertPromise ((querier || defaultQuerier as Querier) (query, values) as Promise<Output>);
  }) as SQLTag<Params, Output>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      nodes
    })
  );

  return tag;
}

function join(this: SQLTag, delimiter: string, other: SQLTag) {
  if (isEmptyTag (this)) return other;
  if (isEmptyTag (other)) return this;

  return createSQLTag (
    this.nodes.concat (Raw (delimiter), ...other.nodes)
  );
}

function concat(this: SQLTag, other: SQLTag) {
  return this.join (" ", other);
}

// const interpretWithPred = (pred: TagFunctionVariable<any, boolean>, tag: SQLTag) => {
//   const { strings, values } = tag.interpret ();

//   return {
//     strings: strings.map (({ run, pred: pred2 }) => ({
//       pred: (p: StringMap) => pred2 (p) && pred (p),
//       run
//     })),
//     values: values.map (({ run, pred: pred2 }) => ({
//       pred: (p: StringMap) => pred2 (p) && pred (p),
//       run
//     }))
//   };
// };

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
        run: p => run (p).flat (1)
      });

      strings.push ({
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
    } else {
      throw new Error (`Unknown SQLNode Type: "${String (node)}"`);
    }
  }

  // for (const p of props) {
  //   const { pred, col, as, operations } = p;
  //   const prop = col || as;

  //   let columnStrings: InterpretedString[] = [{ pred, run: () => [`${table?.name}.${prop}`, 0] }];
  //   let columnValues: InterpretedSQLTagValue[] = [];

  //   if (isSQLTag (prop)) {
  //     // interpredWithPRed moet 1 string retourneren en 1 value array (ops niet gebruiken in sql``)
  //     const { strings: strings2, values: values2 } = interpretWithPred (pred, prop);
  //     columnStrings = [{ pred, run: () => ["(", 0] }, ...strings2, { pred, run: () => [")", 0] }];
  //     columnValues = values2;
  //   }

  return { strings, values };
}

// const filterByPred = (params: StringMap) => (strings: InterpretedString[]) =>
//   strings.filter (({ pred }) => pred (params));

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

  // // should just be strings[] and values []
  // const { strings, orderBies, limits, offsets, values } = this.interpreted;

  // const filterByP = filterByPred (params);

  // let filteredStrings = filterByP (strings);
  // const filteredOrderBies = filterByP (orderBies);
  // const filteredLimits = filterByP (limits);
  // const filteredOffsets = filterByP (offsets);

  // if (filteredOrderBies.length) {
  //   filteredStrings = filteredStrings.concat ([
  //     { pred: truePred, run: () => [" order by ", 0] },
  //     // remove leading comma
  //     ...filteredOrderBies.slice (1)
  //   ]);
  // }

  // let query = filteredStrings
  //   .concat (filteredLimits)
  //   .concat (filteredOffsets)
  //   .reduce (([query, idx]: [string, number], { run }): [string, number] => {
  //     const [s, n] = run (params, idx);

  //     return [query.concat (s), idx + n];
  //   }, ["", 0])[0];

  // if (ending) {
  //   query += ending;
  // }

  // return [
  //   query,
  //   values
  //     .filter (({ pred }) => pred (params))
  //     .map (({ run }) => run (params)).flat (1)
  // ];
}

function setPred(this: SQLTag, fn: (p: any) => boolean) {
  let sqlTag = createSQLTag (this.nodes);

  sqlTag.pred = fn;

  return sqlTag;
}

export const isSQLTag = function <Params = any, Output = any> (x: any): x is SQLTag<Params, Output> {
  return x != null && x[refqlType] === type;
};

//   // move to rql tag
//   for (const op of operations) {
//     const [beginning, ending] = op.interpret (pred);

//
// }

// // sorted selectables
// // move to rqltag
// for (const selectable of selectables) {
//   if (Limit.isLimit (selectable)) {
//     const { pred, run } = selectable;
//     limits.push ({
//       pred,
//       run: (_p, i) => {
//         return [` limit $${i + 1}`, 1];
//       }
//     });

//     values.push ({
//       pred,
//       run
//     });
//   } else if (Offset.isOffset (selectable)) {
//     const { pred, run } = selectable;
//     offsets.push ({
//       pred,
//       run: (_p, i) => {
//         return [` offset $${i + 1}`, 1];
//       }
//     });

//     values.push ({
//       pred,
//       run
//     });
//   } else if (isSQLTag (selectable)) {
//     console.log ("DD");
//     const { pred } = selectable;

//     strings.push ({
//       pred,
//       run: () => [" ", 0]
//     });

//     const { strings: strings2, values: values2 } = interpretWithPred (pred, selectable);

//     strings.push (...strings2);
//     values.push (...values2);
//   }
// }
