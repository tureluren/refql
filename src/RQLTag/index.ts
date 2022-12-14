import { flConcat, flMap, refqlType } from "../common/consts";
import { Querier, StringMap } from "../common/types";
import Interpreter from "../Interpreter";
import { ASTNode } from "../nodes";
import SQLTag from "../SQLTag";
import Table from "../Table";

export interface Next {
  tag: RQLTag<unknown, unknown>;
  single: boolean;
  params: StringMap;
}

interface InterpretedRQLTag<Params> {
  tag: SQLTag<Params, unknown>;
  next: Next[];
}

interface RQLTag<Params, Output> {
  table: Table;
  nodes: ASTNode<Params>[];
  interpreted: InterpretedRQLTag<Params>;
  concat<Params2, Output2>(other: RQLTag<Params2, Output2>): RQLTag<Params & Params2, Output & Output2>;
  [flConcat]: RQLTag<Params, Output>["concat"];
  map<Params2>(f: (nodes: ASTNode<Params>[]) => ASTNode<Params2>[]): RQLTag<Params2, Output>;
  [flMap]: RQLTag<Params, Output>["map"];
  interpret(): InterpretedRQLTag<Params>;
  compile(params?: Params): [string, any[], Next[]];
  aggregate(querier: Querier, params: Params): Promise<Output[]>;
  run(querier: Querier, params?: Params): Promise<Output[]>;
}

const type = "refql/RQLTag";

const prototype = {
  [refqlType]: type,
  constructor: RQLTag,
  concat,
  [flConcat]: concat,
  map,
  [flMap]: map,
  interpret,
  compile,
  aggregate,
  run
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
  const { tag, next } = Interpreter (this.nodes);

  return {
    tag, next
  };
}

function compile(this: RQLTag<unknown, unknown>, params: unknown = {}) {
  if (!this.interpreted) {
    this.interpreted = this.interpret ();
  }
  const { tag, next } = this.interpreted;

  return [...tag.compile (params, this.table), next];
}

function aggregate(this: RQLTag<unknown, unknown>, querier: Querier, params: unknown): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  return querier (query, values).then (rows => {
    if (!rows.length) {
      return Promise.resolve ([]);
    }

    return Promise.all (next.map (n => n.tag.aggregate (querier, { ...(params || {}), refQL: { rows, ...n.params } }))).then (nextData =>
      rows.map (row =>
        nextData.reduce ((agg, nextRows, idx) => {
          const { single, params } = next[idx];
          const { as, lRef, rRef, lxRef } = params;

          const lr = lRef.as;
          const rr = (lxRef || rRef).as;

          agg[as] = nextRows
            .filter ((r: any) =>
              r[rr] === row[lr]
            )
            .map (r => {
              const matched = { ...r };
              delete matched[rr];
              return matched;
            });

          if (single) {
            agg[as] = agg[as][0];
          }

          delete agg[lr];

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