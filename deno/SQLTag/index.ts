import { flConcat, refqlType } from "../common/consts.ts";
import isEmptyTag from "../common/isEmptyTag.ts";
import RQLEmpty from "../common/RQLEmpty.ts";
import { Querier, RequiredRefQLOptions, StringMap, TagFunctionVariable } from "../common/types.ts";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode.ts";
import Raw from "./Raw.ts";
import SQLNode from "./SQLNode.ts";
import Value from "./Value.ts";
import Values from "./Values.ts";
import Values2D from "./Values2D.ts";

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
  (params: {} extends Params ? Params | void : Params): Promise<Output[]>;
  params: Params;
  nodes: SQLNode<Params>[];
  interpreted?: InterpretedSQLTag<Params>;
  concat<Params2, Output2>(other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
  join<Params2, Output2>(delimiter: Raw | string, other: SQLTag<Params2, Output2>): SQLTag<Params & Params2, Output & Output2>;
  [flConcat]: this["concat"];
  interpret(): InterpretedSQLTag<Params>;
  compile(params: Params): [string, any[]];
  options: RequiredRefQLOptions;
  run(params: Params, querier?: Querier): Promise<Output[]>;
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
  run
});

const getParameterSign = (options: RequiredRefQLOptions) => (i: number) => {
  return options.parameterSign + (options.indexedParameters ? i : "");
};

export function createSQLTag<Params = {}, Output = any>(nodes: SQLNode<Params>[], options: RequiredRefQLOptions) {
  const tag = ((params: Params) => {
    return options.runner (tag, params);
  }) as SQLTag<Params, Output>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, {
      nodes,
      options
    })
  );

  return tag;
}

function join(this: SQLTag, delimiter: Raw | string, other: SQLTag) {
  const raw = Raw.isRaw (delimiter) ? delimiter : Raw (delimiter);

  return createSQLTag (
    this.nodes.concat (raw, ...other.nodes),
    this.options
  );
}

function concat(this: SQLTag, other: SQLTag) {
  if (isEmptyTag (this)) return other;
  if (isEmptyTag (other)) return this;

  return this.join (" ", other);
}

function interpret(this: SQLTag): InterpretedSQLTag {
  const strings = [] as InterpretedSQLTagString[],
    values = [] as InterpretedSQLTagValue[],
    getPSign = getParameterSign (this.options);


  for (const node of this.nodes) {
    if (Raw.isRaw (node)) {
      strings.push ({
        run: (p, _i) => {
          return [node.run (p), 0];
        }
      });
    } else if (Value.isValue (node)) {

      values.push ({
        run: p => {
          const ran = node.run (p);

          // null is allowed, undefined not
          if (ran === RQLEmpty) return [];

          return [ran];
        }
      });

      strings.push ({
        run: (p, i) => {
          const ran = node.run (p);

          if (ran === RQLEmpty) return ["", 0];

          return [getPSign (i + 1), 1];
        }
      });
    } else if (Values.isValues (node)) {
      const { run } = node;

      values.push ({ run });

      strings.push ({
        run: (p, i) => {
          const xs = run (p);
          return [
            `(${xs.map ((_x: any, j: number) => getPSign (i + j + 1)).join (", ")})`,
            xs.length
          ];
        }
      });
    } else if (Values2D.isValues2D (node)) {

      values.push ({
        run: p => node.run (p).flat (1).filter ((p: any) => !Raw.isRaw (p))
      });

      strings.push ({
        run: (p, i) => {
          const values2D = node.run (p),
            s = [];

          let n = 0;

          for (const values of values2D) {
            s.push (
              `(${values.map (v => {
                if (Raw.isRaw (v)) {
                  return v.run (p);
                } else {
                  n += 1;
                  return getPSign (i + n);
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

async function run(this: SQLTag, params: StringMap, querier?: Querier): Promise<any[]> {
  const [query, values] = this.compile (params);

  return (querier || this.options.querier) (query, values);
}

export const isSQLTag = function (x: any): x is SQLTag {
  return x != null && x[refqlType] === type;
};