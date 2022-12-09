import { flConcat, flMap, refqlType } from "../common/consts";
import { Querier, TagFunctionVariable } from "../common/types";
import createEnv from "../Env/createEnv";
import { Next } from "../Env/Rec";
import Interpreter from "../Interpreter";
import { ASTNode } from "../nodes";
import Root from "../nodes/Root";
import Table from "../Table";

interface InterpretedRQLTag<Params> {
  values: TagFunctionVariable<Params>[];
  strings: TagFunctionVariable<Params>[];
  next: Next[];
}

interface RQLTag<Params, Output> {
  table: Table;
  nodes: ASTNode<Params>[];
  interpreted: InterpretedRQLTag<Params>;
  // Output2 ?
  concat<Params2>(other: RQLTag<Params2, Output>): RQLTag<Params & Params2, Output>;
  map<Params2>(f: (nodes: ASTNode<Params>[]) => ASTNode<Params2>[]): RQLTag<Params2, Output>;
  interpret(): InterpretedRQLTag<Params>;
  compile(params?: Params, paramIdx?: number): [string, any[]];
  aggregate(querier: Querier, params: Params): Promise<Output[]>;
  run<Return>(querier: Querier, params?: Params): Promise<Return[]>;
  [flConcat]: RQLTag<Params, Output>["concat"];
  [flMap]: RQLTag<Params, Output>["map"];
}

// maak aggregate functie op rqltag

const type = "refql/RQLTag";

const prototype = {
  constructor: RQLTag,
  [refqlType]: type,
  concat, [flConcat]: concat,
  map, [flMap]: map, run, interpret, compile, aggregate
};

function RQLTag<Params, Output>(table: Table, nodes: ASTNode<Params>[]) {
  let tag: RQLTag<Params, Output> = Object.create (prototype);
  tag.table = table;
  tag.nodes = nodes;

  return tag;
}

function concat(this: RQLTag<unknown, unknown>, other: RQLTag<unknown, unknown>) {
  if (!this.table.equals (other.table)) {
    throw new Error ("U can't concat RQLTags with a different root table");
  }

  return RQLTag (
    this.table,
    this.nodes.concat (other.nodes)
  );
}

function map(this: RQLTag<unknown, unknown>, f: (nodes: ASTNode<unknown>[]) => ASTNode<unknown>[]) {
  return RQLTag (this.table, f (this.nodes));
}

function interpret(this: RQLTag<unknown, unknown>): InterpretedRQLTag<unknown> {
  const { strings, values, next } = Interpreter (this.table, this.nodes);

  return {
    strings, values, next
  };
}

function compile(this: RQLTag<unknown, unknown>, data: unknown = {}, paramIdx: number = 0) {
  if (!this.interpreted) {
    this.interpreted = this.interpret ();
  }
  const { strings, values, next } = this.interpreted;

  return [
    strings.reduce ((query: string, f): string => {
      const s = f (data, this.table);
      return `${query} ${s}`.trim ();
    }, ""),
    values.map (f => f (data)).flat (1),
    next
  ];
}

const match = (row: any, nextRows: any[], lRef: string, rRef: string) =>
  nextRows.filter ((r: any) =>
    r[rRef.as] === row[lRef.as]
  ).map (r => {
    const matched = { ...r };
    delete matched[rRef.as];
    return matched;
  });

function aggregate(this: RQLTag<unknown, unknown>, querier: Querier, params: unknown): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  return querier (query, values).then (refQLRows => {
    console.log (refQLRows.length);
    if (!refQLRows.length) {
      return Promise.resolve ([]);
    }

    return Promise.all (next.map (n => n.tag.aggregate (querier, { ...(params || {}), refQLRows }))).then (nextData =>
      refQLRows.map (row =>
        nextData.reduce ((agg, nextRows, idx) => {
          const { refType, as, lRef, rRef } = next[idx];

          // refType vervangen door one of multiple
          if (refType === "BelongsTo") {
            agg[as] = match (row, nextRows, lRef, rRef)[0];
          } else if (refType === "HasMany") {
            agg[as] = match (row, nextRows, lRef, rRef);
          } else if (refType === "HasOne") {
            agg[as] = match (row, nextRows, lRef, rRef)[0];
          } else if (refType === "BelongsToMany") {
            agg[as] = match (row, nextRows, lRef, rRef);
          }


          delete agg[lRef.as];

          return agg;
        }, row)
      )
    );
  });
}

function run(this: RQLTag<unknown, unknown>, querier: Querier, params?: unknown) {
  return new Promise ((res, rej) => {
    this.aggregate (querier, params)
      .then (res)
      .catch (rej);
  });
}

RQLTag.isRQLTag = function <Params, Output> (value: any): value is RQLTag<Params, Output> {
  return value != null && value[refqlType] === type;
};

export default RQLTag;