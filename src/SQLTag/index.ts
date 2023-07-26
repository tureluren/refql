import { flConcat, refqlType } from "../common/consts";
import { getConvertPromise } from "../common/convertPromise";
import getGlobalQuerier from "../common/defaultQuerier";
import isEmptyTag from "../common/isEmptyTag";
import truePred from "../common/truePred";
import { Querier, StringMap, TagFunctionVariable } from "../common/types";
import Eq from "../RQLTag/Eq";
import In from "../RQLTag/In";
import Like from "../RQLTag/Like";
import Limit from "../RQLTag/Limit";
import Offset from "../RQLTag/Offset";
import Ord from "../RQLTag/Ord";
import OrderBy from "../RQLTag/OrderBy";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import Table from "../Table";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import Raw from "./Raw";
import SQLNode from "./SQLNode";
import Value from "./Value";
import Values from "./Values";
import Values2D from "./Values2D";
import When2 from "./When2";

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
  orderBies: InterpretedString<Params>[];
  limits: InterpretedString<Params>[];
  offsets: InterpretedString<Params>[];
  values: InterpretedValue<Params>[];
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
  interpret(selectables?: SelectableType[], table?: Table): InterpretedSQLTag<Params>;
  compile(params: Params, selectables?: SelectableType[], table?: Table, ending?: string): [string, any[]];
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

const interpretWithPred = (pred: TagFunctionVariable<any, boolean>, tag: SQLTag) => {
  const { strings, values } = tag.interpret ();

  return {
    strings: strings.map (({ run, pred: pred2 }) => ({
      pred: (p: StringMap) => pred2 (p) && pred (p),
      run
    })),
    values: values.map (({ run, pred: pred2 }) => ({
      pred: (p: StringMap) => pred2 (p) && pred (p),
      run
    }))
  };
};

function interpret(this: SQLTag, selectables: SelectableType[] = [], table?: Table): InterpretedSQLTag {
  const strings = [] as InterpretedString[],
    orderBies = [] as InterpretedString[],
    limits = [] as InterpretedString[],
    offsets = [] as InterpretedString[],
    values = [] as InterpretedValue[];


  for (const [idx, node] of this.nodes.entries ()) {
    if (Raw.isRaw (node)) {
      const { run } = node;
      const nextNode = this.nodes[idx + 1];

      strings.push ({
        pred: truePred,
        run: (p, _i) => {
          let s = run (p);
          if (When2.isWhen2 (nextNode) && !nextNode.pred (p)) {
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
    } else if (When2.isWhen2 (node)) {
      const { pred, tag } = node;

      const { strings: strings2, values: values2 } = interpretWithPred (pred, tag);

      strings.push (...strings2);
      values.push (...values2);
    } else {
      throw new Error (`Unknown SQLNode Type: "${String (node)}"`);
    }
  }

  // sorted selectables
  for (const selectable of selectables) {
    if (Limit.isLimit (selectable)) {
      const { pred, run } = selectable;
      limits.push ({
        pred,
        run: (_p, i) => {
          return [` limit $${i + 1}`, 1];
        }
      });

      values.push ({
        pred,
        run
      });
    } else if (Offset.isOffset (selectable)) {
      const { pred, run } = selectable;
      offsets.push ({
        pred,
        run: (_p, i) => {
          return [` offset $${i + 1}`, 1];
        }
      });

      values.push ({
        pred,
        run
      });
    } else if (Eq.isEq (selectable)) {
      const { pred, prop, run, isNot } = selectable;
      const equality = isNot ? "!=" : "=";

      if (isSQLTag (prop)) {
        strings.push ({
          pred,
          run: () => [" and (", 0]
        });

        const { strings: strings2, values: values2 } = interpretWithPred (pred, prop);

        strings.push (...strings2);
        values.push (...values2);

        strings.push ({
          pred,
          run: (_p, i) => [`) ${equality} $${i + 1}`, 1]
        });

      } else {
        strings.push ({
          pred,
          run: (_p, i) => {
            return [` and ${table?.name}.${prop} ${equality} $${i + 1}`, 1];
          }
        });
      }

      values.push ({
        pred,
        run
      });
    } else if (Ord.isOrd (selectable)) {
      const { pred, prop, run, operator } = selectable;

      if (isSQLTag (prop)) {
        strings.push ({
          pred,
          run: () => [" and (", 0]
        });

        const { strings: strings2, values: values2 } = interpretWithPred (pred, prop);

        strings.push (...strings2);
        values.push (...values2);

        strings.push ({
          pred,
          run: (_p, i) => [`) ${operator} $${i + 1}`, 1]
        });

      } else {
        strings.push ({
          pred,
          run: (_p, i) => {
            return [` and ${table?.name}.${prop} ${operator} $${i + 1}`, 1];
          }
        });
      }

      values.push ({
        pred,
        run
      });
    } else if (Like.isLike (selectable)) {
      const { pred, prop, run, caseSensitive, isNot } = selectable;
      const like = caseSensitive ? "like" : "ilike";
      const equality = isNot ? `not ${like}` : like;

      if (isSQLTag (prop)) {
        strings.push ({
          pred,
          run: () => [" and (", 0]
        });

        const { strings: strings2, values: values2 } = interpretWithPred (pred, prop);

        strings.push (...strings2);
        values.push (...values2);

        strings.push ({
          pred,
          run: (_p, i) => [`) ${equality} $${i + 1}`, 1]
        });

      } else {
        strings.push ({
          pred,
          run: (_p, i) => {
            return [` and ${table?.name}.${prop} ${equality} $${i + 1}`, 1];
          }
        });
      }

      values.push ({
        pred,
        run
      });
    } else if (In.isIn (selectable)) {
      const { pred, prop, run, isNot } = selectable;
      const equality = isNot ? "not in" : "in";

      if (isSQLTag (prop)) {
        strings.push ({
          pred,
          run: () => [" and (", 0]
        });

        const { strings: strings2, values: values2 } = interpretWithPred (pred, prop);

        strings.push (...strings2);
        values.push (...values2);

        strings.push ({
          pred,
          run: (p, i) => {
            const xs = run (p);
            return [
              `) ${equality} (${xs.map ((_x, j) => `$${i + j + 1}`).join (", ")})`,
              xs.length
            ];
          }
        });

      } else {

        strings.push ({
          pred,
          run: (p, i) => {
            const xs = run (p);
            return [
              ` and ${table?.name}.${prop} ${equality} (${xs.map ((_x, j) => `$${i + j + 1}`).join (", ")})`,
              xs.length
            ];
          }
        });

      }

      values.push ({
        pred,
        run
      });
    } else if (OrderBy.isOrderBy (selectable)) {
      const { pred, prop, descending } = selectable;
      orderBies.push ({
        pred,
        run: () => [", ", 0]
      });

      if (isSQLTag (prop)) {
        orderBies.push ({
          pred,
          run: () => ["(", 0]
        });

        const { strings: strings2, values: values2 } = interpretWithPred (pred, prop);

        orderBies.push (...strings2);
        values.push (...values2);

        orderBies.push ({
          pred,
          run: () => [`) ${descending ? "desc" : "asc"}`, 0]
        });

      } else {
        orderBies.push ({
          pred,
          run: () => [`${table?.name}.${prop} ${descending ? "desc" : "asc"}`, 0]
        });
      }
    } else if (isSQLTag (selectable)) {
      const { pred } = selectable;

      strings.push ({
        pred,
        run: () => [" ", 0]
      });

      const { strings: strings2, values: values2 } = interpretWithPred (pred, selectable);

      strings.push (...strings2);
      values.push (...values2);
    }
  }

  return { strings, limits, orderBies, offsets, values };
}

const filterByPred = (params: StringMap) => (strings: InterpretedString[]) =>
  strings.filter (({ pred }) => pred (params));

function compile(this: SQLTag, params: StringMap, selectables: SelectableType[] = [], table?: Table, ending?: string) {
  if (!this.interpreted) {
    this.interpreted = this.interpret (selectables, table);
  }

  const { strings, orderBies, limits, offsets, values } = this.interpreted;

  const filterByP = filterByPred (params);

  let filteredStrings = filterByP (strings);
  const filteredOrderBies = filterByP (orderBies);
  const filteredLimits = filterByP (limits);
  const filteredOffsets = filterByP (offsets);

  if (filteredOrderBies.length) {
    filteredStrings = filteredStrings.concat ([
      { pred: truePred, run: () => [" order by ", 0] },
      // remove leading comma
      ...filteredOrderBies.slice (1)
    ]);
  }

  let query = filteredStrings
    .concat (filteredLimits)
    .concat (filteredOffsets)
    .reduce (([query, idx]: [string, number], { run }): [string, number] => {
      const [s, n] = run (params, idx);

      return [query.concat (s), idx + n];
    }, ["", 0])[0];

  if (ending) {
    query += ending;
  }

  return [
    query,
    values
      .filter (({ pred }) => pred (params))
      .map (({ run }) => run (params)).flat (1)
  ];
}

function setPred(this: SQLTag, fn: (p: any) => boolean) {
  let sqlTag = createSQLTag (this.nodes);

  sqlTag.pred = fn;

  return sqlTag;
}

export const isSQLTag = function <Params = any, Output = any> (x: any): x is SQLTag<Params, Output> {
  return x != null && x[refqlType] === type;
};