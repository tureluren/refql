import { flConcat, flMap, refqlType } from "../common/consts";
import { Querier, TagFunctionVariable } from "../common/types";
import createEnv from "../Env/createEnv";
import { Next } from "../Env/Rec";
import Interpreter from "../Interpreter";
import Root from "../nodes/Root";

interface InterpretedRQLTag<Params> {
  values: TagFunctionVariable<Params>[];
  strings: TagFunctionVariable<Params>[];
  next: Next[];
}

interface RQLTag<Params, Output> {
  node: Root<Params>;
  interpreted: InterpretedRQLTag<Params>;
  // Output2 ?
  concat<Params2>(other: RQLTag<Params2, Output>): RQLTag<Params & Params2, Output>;
  map<Params2>(f: (node: Root<Params>) => Root<Params2>): RQLTag<Params2, Output>;
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

function RQLTag<Params, Output>(node: Root<Params>) {
  if (!(Root.isRoot (node))) {
    throw new Error ("RQLTag should hold a Root node");
  }

  let tag: RQLTag<Params, Output> = Object.create (prototype);
  tag.node = node;

  return tag;
}

function concat(this: RQLTag<unknown, unknown>, other: RQLTag<unknown, unknown>) {
  const { table, members } = this.node;
  const { table: table2, members: members2 } = other.node;

  if (!table.equals (table2)) {
    throw new Error ("U can't concat RQLTags with a different root table");
  }

  return RQLTag (Root (
    table,
    members.concat (members2)
  ));
}

function map(this: RQLTag<unknown, unknown>, f: (node: Root<unknown>) => Root<unknown>) {
  return RQLTag (f (this.node));
}

function interpret(this: RQLTag<unknown, unknown>): InterpretedRQLTag<unknown> {
  const { strings, values, next } = Interpreter (this.node, createEnv (this.node.table));

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
      const s = f (data, this.node.table);
      return `${query} ${s}`.trim ();
    }, ""),
    values.map (f => f (data)).flat (1),
    next
  ];
}

const match = (row: any, nextRows: any[], lRefs: string[], rRefs: string[]) =>
  nextRows.filter ((r: any) =>
    rRefs.reduce ((acc, rr, idx) =>
      acc && (r[rr] === row[lRefs[idx]]),
      true as boolean
    )
  ).map (r => {
    const matched = { ...r };
    rRefs.forEach (rr => {
      delete matched[rr];
    });
    return matched;
  });

function aggregate(this: RQLTag<unknown, unknown>, querier: Querier, params: unknown): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  return querier (query, values).then (rows => {
    if (!rows.length) {
      return Promise.resolve ([]);
    }

    return Promise.all (next.map (n => n.aggregate (querier, params))).then (nextData =>
      rows.map (row =>
        nextData.reduce ((agg, nextRows, idx) => {
          console.log (next[0]);
          const { node, refs } = compiled.next[idx];

          const lRefs = refs.lRefs.map (lr => lr.as);
          const rRefs = refs.rRefs.map (rr => rr.as);
          const lxRefs = refs.lxRefs.map (lxr => lxr.as);

          if (BelongsTo.isBelongsTo (node)) {
            agg[node.info.as] = match (row, nextRows, lRefs, rRefs)[0];

          } else if (HasMany.isHasMany (node)) {
            agg[node.info.as] = match (row, nextRows, lRefs, rRefs);

          } else if (HasOne.isHasOne (node)) {
            agg[node.info.as] = match (row, nextRows, lRefs, rRefs)[0];

          } else if (BelongsToMany.isBelongsToMany (node)) {
            agg[node.info.as] = match (row, nextRows, lRefs, lxRefs);
          }

          lRefs.forEach (lr => {
            delete agg[lr];
          });

          return agg;
        }, row)
      )
    );
  });
}

function run(this: RQLTag<unknown, unknown>, querier: Querier, params?: unknown) {
  return new Promise ((res, rej) => {
    if (!(Root.isRoot (this.node))) {
      rej (new Error ("You can only run a RQLTag that holds a Root node"));
      return;
    }

    if (!this.node.hasOwnProperty ("table")) {
      rej (new Error ("The Root node has no table"));
      return;
    }

    this.aggregate (querier, params)
      .then (res)
      .catch (rej);
  });
}

RQLTag.isRQLTag = function <Params, Output> (value: any): value is RQLTag<Params, Output> {
  return value != null && value[refqlType] === type;
};

export default RQLTag;