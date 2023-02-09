import castAs from "../common/castAs";
import { flConcat, flContramap, flMap, flPromap, refqlType } from "../common/consts";
import joinMembers from "../common/joinMembers";
import { Querier, RefInfo, RefQLRows, Runnable, StringMap } from "../common/types";
import unimplemented from "../common/unimplemented";
import { all, ASTNode, Raw, RefNode, When } from "../nodes";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";

export interface Next<Params = unknown, Output = unknown> {
  tag: RQLTag<Params & RefQLRows, Output>;
  link: [string, string];
  single: boolean;
}

interface InterpretedRQLTag<Params = unknown, Output = unknown> {
  tag: SQLTag<Params, Output>;
  next: Next<Params, Output>[];
}

interface Extra<Params = unknown, Output = unknown> {
  extra: SQLTag<Params, Output>;
}

interface RQLTag<Params = unknown, Output = unknown> {
  table: Table;
  nodes: ASTNode<Params, Output>[];
  defaultQuerier?: Querier;
  interpreted: InterpretedRQLTag<Params, Output>;
  concat<Params2, Output2>(other: RQLTag<Params2, Output2>): RQLTag<Params & Params2, Output & Output2> & Runnable<Params & Params2, Output & Output2>;
  [flConcat]: RQLTag<Params, Output>["concat"];
  contramap<Params2>(f: (p: Params) => Params2): RQLTag<Params2, Output> & Runnable<Params, Output>;
  [flContramap]: RQLTag<Params, Output>["contramap"];
  map<Output2>(f: (rows: Output) => Output2): RQLTag<Params, Output2> & Runnable<Params, Output2>;
  [flMap]: RQLTag<Params, Output>["map"];
  promap<Params2, Output2>(f: (p: Params) => Params2, g: (rows: Output) => Output2): RQLTag<Params2, Output2> & Runnable<Params2, Output2>;
  [flPromap]: RQLTag<Params, Output>["promap"];
  interpret(): InterpretedRQLTag<Params, Output> & Extra<Params, Output>;
  compile(params: Params): [string, any[], Next<Params, Output>[]];
  aggregate(params: Params, querier: Querier): Promise<Output>;
  run(params: Params, querier?: Querier): Promise<Output>;
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
  promap,
  [flPromap]: promap,
  interpret,
  compile,
  aggregate,
  run
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
    Object.assign (Object.create (Function.prototype), prototype, { table, nodes, defaultQuerier })
  );

  return tag;
}


function run(this: RQLTag & Runnable, params: unknown, querier: Querier) {
  return this (params, querier);
}

type Deep = { [tableId: string]: RefNode} & { nodes: ASTNode[]};

const concatDeep = (nodes: ASTNode[]): Deep => {
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
  }, { nodes: [] as ASTNode[] } as Deep);
};

function concat(this: RQLTag, other: RQLTag) {
  if (!this.table.equals (other.table)) {
    throw new Error ("U can't concat RQLTags that come from different tables");
  }

  const { nodes, ...refs } = concatDeep (this.nodes.concat (other.nodes));

  return RQLTag (
    this.table,
    [...nodes, ...Object.values (refs)],
    this.defaultQuerier
  );
}

function map(this: RQLTag & Runnable, f: (rows: unknown) => unknown) {
  let newTag = RQLTag (this.table, this.nodes, this.defaultQuerier);

  const tag = (params?: unknown, querier?: Querier) => this (params, querier).then (f);

  Object.setPrototypeOf (tag, newTag);

  return tag;
}

function contramap(this: RQLTag & Runnable, f: (p: unknown) => unknown) {
  let newTag = RQLTag (this.table, this.nodes, this.defaultQuerier);

  const tag = (params?: unknown, querier?: Querier) => this (f (params), querier);

  Object.setPrototypeOf (tag, newTag);

  return tag;
}

function promap(this: RQLTag & Runnable, g: (p: unknown) => unknown, f: (rows: unknown) => unknown) {
  let newTag = RQLTag (this.table, this.nodes, this.defaultQuerier);

  const tag = (params?: unknown, querier?: Querier) => this (g (params), querier).then (f);

  Object.setPrototypeOf (tag, newTag);

  return tag;
}

const unsupported = unimplemented ("RQLTag");

function interpret(this: RQLTag): InterpretedRQLTag & Extra {
  const { nodes, table } = this,
    next = [] as Next[],
    members = [] as (Raw | SQLTag)[];

  let extra = SQLTag.empty ();

  const caseOfRef = (tag: RQLTag<RefQLRows>, info: RefInfo, single: boolean) => {
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

  let tag = sql`
    select ${joinMembers (members)}
    from ${Raw (table)}
  `;

  return { next, tag, extra };
}

function compile(this: RQLTag, params: unknown) {
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

async function aggregate(this: RQLTag, params: StringMap, querier: Querier): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  const refQLRows = await querier<any> (query, values);

  if (!refQLRows.length) return [];

  const nextData = await Promise.all (next.map (
    // { ...null } = {}
    n => n.tag.aggregate ({ ...params, refQLRows }, querier)
  )) as any[][];

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