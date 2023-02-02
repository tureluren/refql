import castAs from "../common/castAs";
import { flConcat, flContramap, flMap, refqlType } from "../common/consts";
import joinMembers from "../common/joinMembers";
import { Querier, RefInfo, RefQLRows, Runnable, StringMap } from "../common/types";
import unimplemented from "../common/unimplemented";
import { all, ASTNode, Raw, RefNode, When } from "../nodes";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";

export interface Next<Params, Output> {
  tag: RQLTag<Params & RefQLRows, Output>;
  link: [string, string];
  single: boolean;
}

interface InterpretedRQLTag<Params, Output> {
  tag: SQLTag<Params, Output>;
  next: Next<Params, Output>[];
}

interface Extra<Params, Output> {
  extra: SQLTag<Params, Output>;
}

interface RQLTag<Params, Output> {
  table: Table;
  nodes: ASTNode<Params, Output>[];
  interpreted: InterpretedRQLTag<Params, Output>;
  concat<Params2, Output2>(other: RQLTag<Params2, Output2>): RQLTag<Params & Params2, Output & Output2> & Runnable<Params & Params2, Output & Output2>;
  [flConcat]: RQLTag<Params, Output>["concat"];
  contramap<Params2>(f: (p: Params) => Params2): RQLTag<Params2, Output> & Runnable<Params, Output>;
  [flContramap]: RQLTag<Params, Output>["contramap"];
  map<Output2>(f: (rows: Output) => Output2): RQLTag<Params, Output2> & Runnable<Params, Output2>;
  [flMap]: RQLTag<Params, Output>["map"];
  interpret(): InterpretedRQLTag<Params, Output> & Extra<Params, Output>;
  compile(params: Params): [string, any[], Next<Params, Output>[]];
  aggregate(params: Params, querier: Querier): Promise<Output>;
}

const type = "refql/RQLTag";

const prototype = {
  constructor: RQLTag,
  [refqlType]: type,
  concat,
  [flConcat]: concat,
  contramap: contramap,
  [flContramap]: contramap,
  map,
  [flMap]: map,
  interpret,
  compile,
  aggregate
};

function RQLTag<Params, Output>(table: Table, nodes: ASTNode<Params, Output>[], defaultQuerier?: Querier): RQLTag<Params, Output> & Runnable<Params, Output> {
  const tag = ((params: Params = {} as Params, querier?: Querier) => {
    if (!querier && !defaultQuerier) {
      throw new Error ("There was no Querier provided");
    }
    return tag.aggregate (params, (querier || defaultQuerier) as Querier);
  }) as RQLTag<Params, Output> & Runnable<Params, Output>;

  Object.setPrototypeOf (
    tag,
    Object.assign (Object.create (Function.prototype), prototype, { table, nodes })
  );

  return tag;
}

type Deep = { [tableId: string]: RefNode<unknown, unknown>} & { nodes: ASTNode<unknown, unknown>[]};

const concatDeep = (nodes: ASTNode<unknown, unknown>[]): Deep => {
  return nodes.reduce ((acc, node) => {
    if (RefNode.isRefNode (node)) {
      const { table } = node.tag;
      const id = table.toString ();

      if (acc[id]) {
        acc[id].tag = acc[id].tag.concat (node.tag);
      } else {
        acc[id] = node;
      }
    } else {
      acc.nodes.push (node);
    }
    return acc;
  }, { nodes: [] as ASTNode<unknown, unknown>[] } as Deep);
};

function concat(this: RQLTag<unknown, unknown>, other: RQLTag<unknown, unknown>) {
  if (!this.table.equals (other.table)) {
    throw new Error ("U can't concat RQLTags that come from different tables");
  }

  const { nodes, ...refs } = concatDeep (this.nodes.concat (other.nodes));

  return RQLTag (
    this.table,
    [...nodes, ...Object.values (refs)]
  );
}

function map(this: RQLTag<unknown, unknown> & Runnable<unknown, unknown>, f: (rows: unknown) => unknown) {
  let newTag = RQLTag (this.table, this.nodes);

  const tag = (params?: unknown, querier?: Querier) => this (params, querier).then (f);

  Object.setPrototypeOf (tag, newTag);

  return tag;
}

function contramap(this: RQLTag<unknown, unknown> & Runnable<unknown, unknown>, f: (p: unknown) => unknown) {
  let newTag = RQLTag (this.table, this.nodes);

  const tag = (params?: unknown, querier?: Querier) => this (f (params), querier);

  Object.setPrototypeOf (tag, newTag);

  return tag;
}

const unsupported = unimplemented ("RQLTag");

function interpret(this: RQLTag<unknown, unknown>): InterpretedRQLTag<unknown, unknown> & Extra<unknown, unknown> {
  const { nodes, table } = this,
    next = [] as Next<unknown, unknown>[],
    members = [] as (Raw<unknown> | SQLTag<unknown, unknown>)[];

  let extra = SQLTag.empty<unknown, unknown> ();

  const caseOfRef = (tag: RQLTag<RefQLRows, unknown>, info: RefInfo, single: boolean) => {
    members.push (Raw (info.lRef));

    next.push ({ tag, link: [info.as, info.lRef.as], single });
  };

  for (const node of nodes) {
    node.caseOf<void> ({
      RefNode: caseOfRef,
      BelongsToMany: caseOfRef,
      Call: (tag, name, as, cast) => {
        members.push (sql`
          ${Raw (name)} (${tag})${Raw (castAs (cast, as))}
        `);
      },
      All: sign => {
        members.push (
          Raw (`${table.name}.${sign}`)
        );
      },
      Identifier: (name, as, cast) => {
        members.push (
          Raw (`${table.name}.${name}${castAs (cast, as)}`)
        );
      },
      Variable: (x, as, cast) => {
        if (SQLTag.isSQLTag (x)) {
          if (as) {
            members.push (sql`
              (${x})${Raw (castAs (cast, as))} 
            `);
          } else {
            extra = extra.concat (x);
          }

        } else {
          throw new Error (`U can't insert "${x}" in this section of the RQLTag`);
        }
      },
      Literal: (x, as, cast) => {
        members.push (Raw (`${x}${castAs (cast, as)}`));
      },
      StringLiteral: (x, as, cast) => {
        members.push (Raw (`'${x}'${castAs (cast, as)}`));
      },
      When: (pred, tag) => {
        extra = extra.concat (sql`${When (pred, tag)}`);
      },
      Raw: unsupported ("Raw"),
      Value: unsupported ("Value"),
      Values: unsupported ("Values"),
      Values2D: unsupported ("Values2D")
    });
  }

  const refMemberLength = nodes.reduce ((n, node) =>
    RefNode.isRefNode (node) ? n + 1 : n
  , 0);

  if (refMemberLength === members.length) {
    members.push (Raw (`${table.name}.${all.sign}`));
  }

  let tag = sql<unknown, unknown>`
    select ${joinMembers (members)}
    from ${Raw (table)}
  `;

  return { next, tag, extra };
}

function compile(this: RQLTag<unknown, unknown>, params: unknown) {
  if (!this.interpreted) {
    const { tag, extra, next } = this.interpret ();

    this.interpreted = {
      tag: tag.concat (sql`where 1 = 1`).concat (extra),
      next
    };
  }

  return [
    ...this.interpreted.tag.compile (params, this.table),
    this.interpreted.next
  ];
}

async function aggregate(this: RQLTag<unknown, unknown>, params: StringMap, querier: Querier): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  const refQLRows = await querier<any> (query, values);

  if (!refQLRows.length) return [];

  const nextData = await Promise.all (next.map (
    // { ...null } = {}
    n => n.tag.aggregate ({ ...params, refQLRows }, querier)
  )) as unknown[][];

  return refQLRows.map (row =>
    nextData.reduce ((agg, nextRows, idx) => {
      const { single, link: [lAs, rAs] } = next[idx];

      agg[lAs] = nextRows
        .filter ((r: any) =>
          r[rAs] === row[rAs]
        )
        .map ((r: any) => {
          let matched = { ...r };
          delete matched[rAs];
          return matched;
        });

      if (single) {
        agg[lAs] = agg[lAs][0] || null;
      }

      delete agg[rAs];

      return agg;
    }, row)
  );
}

RQLTag.isRQLTag = function <Params, Output> (x: any): x is RQLTag<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default RQLTag;