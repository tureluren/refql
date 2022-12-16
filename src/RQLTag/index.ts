import { flConcat, flMap, refqlType } from "../common/consts";
import { Querier, RefInfo, RefQLRows, StringMap } from "../common/types";
import Interpreter from "../Interpreter";
import { ASTNode } from "../nodes";
import SQLTag from "../SQLTag";
import Table from "../Table";

export interface Next<Params> {
  tag: RQLTag<Params & RefQLRows>;
  info: RefInfo;
  single: boolean;
}

interface InterpretedRQLTag<Params> {
  tag: SQLTag<Params>;
  next: Next<Params>[];
}

interface RQLTag<Params> {
  table: Table;
  nodes: ASTNode<Params>[];
  interpreted: InterpretedRQLTag<Params>;
  concat<Params2>(other: RQLTag<Params2>): RQLTag<Params & Params2>;
  [flConcat]: RQLTag<Params>["concat"];
  map<Params2>(f: (nodes: ASTNode<Params>[]) => ASTNode<Params2>[]): RQLTag<Params>;
  [flMap]: RQLTag<Params>["map"];
  interpret(): InterpretedRQLTag<Params>;
  compile(params?: Params): [string, any[], Next<Params>[]];
  aggregate<Output>(querier: Querier, params: Params): Promise<Output[]>;
  run<Output>(querier: Querier, params?: Params): Promise<Output[]>;
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

function RQLTag<Params>(table: Table, nodes: ASTNode<Params>[]) {
  let tag: RQLTag<Params> = Object.create (prototype);
  tag.table = table;
  tag.nodes = nodes;

  return tag;
}

function concat(this: RQLTag<unknown>, other: RQLTag<unknown>) {
  if (!this.table.equals (other.table)) {
    throw new Error ("U can't concat RQLTags with a different root table");
  }

  return RQLTag (
    this.table,
    this.nodes.concat (other.nodes)
  );
}

function map(this: RQLTag<unknown>, f: (nodes: ASTNode<unknown>[]) => ASTNode<unknown>[]) {
  return RQLTag (this.table, f (this.nodes));
}

function interpret(this: RQLTag<unknown>): InterpretedRQLTag<StringMap> {
  const { tag, next } = Interpreter (this.nodes, this.table);

  return {
    tag,
    next
  };
}

function compile(this: RQLTag<unknown>, params: unknown = {}) {
  if (!this.interpreted) {
    this.interpreted = this.interpret ();
  }
  const { tag, next } = this.interpreted;

  return [...tag.compile (params, this.table), next];
}

function aggregate(this: RQLTag<unknown>, querier: Querier, params: unknown): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  return querier<any> (query, values).then (rows => {
    if (!rows.length) return Promise.resolve ([]);

    return Promise.all (
      next.map (n => n.tag.aggregate (querier, { ...(params || {}), refQLRows: rows }))
    ).then (nextData =>
      rows.map (row =>
        nextData.reduce ((agg, nextRows, idx) => {
          const { single, info } = next[idx];
          const { as, lRef, rRef, lxRef } = info;

          const lr = lRef.as;
          const rr = (lxRef || rRef).as;

          agg[as] = nextRows
            .filter ((r: any) =>
              r[rr] === row[lr]
            )
            .map ((r: any) => {
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

function run(this: RQLTag<unknown>, querier: Querier, params?: unknown) {
  return new Promise ((res, rej) => {
    this.aggregate (querier, params)
      .then (res)
      .catch (rej);
  });
}

RQLTag.isRQLTag = function <Params> (value: any): value is RQLTag<Params> {
  return value != null && value[refqlType] === type;
};

export default RQLTag;