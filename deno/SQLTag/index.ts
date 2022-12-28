import { flConcat, flEmpty, flMap, refqlType } from "../common/consts.ts";
import isEmptyTag from "../common/isEmptyTag.ts";
import { Querier, TagFunctionVariable } from "../common/types.ts";
import unimplemented from "../common/unimplemented.ts";
import { ASTNode, Raw } from "../nodes/index.ts";
import Table from "../Table/index.ts";
import sql from "./sql.ts";

type StringFunction<Params> =
  (params: Params, idx: number, table?: Table) => [string, number];

interface InterpretedSQLTag<Params> {
  strings: StringFunction<Params>[];
  values: TagFunctionVariable<Params>[];
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

function interpret(this: SQLTag<unknown>): InterpretedSQLTag<unknown> {
  const strings = [] as StringFunction<unknown>[];
  const values = [] as TagFunctionVariable<unknown>[];

  for (const node of this.nodes) {
    node.caseOf<void> ({
      Raw: run => {
        strings.push ((p, _i, t) => [`${run (p, t)}`, 0]);
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
      },

      Identifier: unsupported ("Identifier"),
      BelongsTo: unsupported ("BelongsTo"),
      BelongsToMany: unsupported ("BelongsToMany"),
      HasMany: unsupported ("HasMany"),
      HasOne: unsupported ("HasOne"),
      All: unsupported ("All"),
      Variable: unsupported ("Variable"),
      Ref: unsupported ("Ref"),
      Call: unsupported ("Call"),
      StringLiteral: unsupported ("StringLiteral"),
      NumericLiteral: unsupported ("NumericLiteral"),
      BooleanLiteral: unsupported ("BooleanLiteral"),
      NullLiteral: unsupported ("NullLiteral")
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
    strings.reduce (([query, idx]: [string, number], f): [string, number] => {
      const [s, n] = f (params, idx, table);

      return [`${query}${s}`, idx + n];
    }, ["", 0])[0],

    values.map (f => f (params, table as Table)).flat (1)
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