import castAs from "../common/castAs.ts";
import { flConcat, flMap, refqlType } from "../common/consts.ts";
import joinMembers from "../common/joinMembers.ts";
import { Querier, RefInfo, RefQLRows, StringMap } from "../common/types.ts";
import unimplemented from "../common/unimplemented.ts";
import { all, ASTNode, Raw, RefNode, When } from "../nodes/index.ts";
import SQLTag from "../SQLTag/index.ts";
import sql from "../SQLTag/sql.ts";
import Table from "../Table/index.ts";

export interface Next<Params> {
  tag: RQLTag<Params & RefQLRows>;
  link: [string, string];
  single: boolean;
}

interface InterpretedRQLTag<Params> {
  tag: SQLTag<Params>;
  next: Next<Params>[];
}

interface Extra<Params> {
  extra: SQLTag<Params>;
}

interface RQLTag<Params> {
  table: Table;
  nodes: ASTNode<Params>[];
  interpreted: InterpretedRQLTag<Params>;
  concat<Params2>(other: RQLTag<Params2>): RQLTag<Params & Params2>;
  [flConcat]: RQLTag<Params>["concat"];
  map<Params2>(f: (nodes: ASTNode<Params>[]) => ASTNode<Params2>[]): RQLTag<Params>;
  [flMap]: RQLTag<Params>["map"];
  interpret(): InterpretedRQLTag<Params> & Extra<Params>;
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

type Deep = { [tableId: string]: RefNode<unknown>} & { nodes: ASTNode<unknown>[]};

const concatDeep = (nodes: ASTNode<unknown>[]): Deep => {
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
  }, { nodes: [] as ASTNode<unknown>[] } as Deep);
};

function concat(this: RQLTag<unknown>, other: RQLTag<unknown>) {
  if (!this.table.equals (other.table)) {
    throw new Error ("U can't concat RQLTags that come from different tables");
  }

  const { nodes, ...refs } = concatDeep (this.nodes.concat (other.nodes));

  return RQLTag (
    this.table,
    [...nodes, ...Object.values (refs)]
  );
}

function map(this: RQLTag<unknown>, f: (nodes: ASTNode<unknown>[]) => ASTNode<unknown>[]) {
  return RQLTag (this.table, f (this.nodes));
}

const unsupported = unimplemented ("RQLTag");

function interpret(this: RQLTag<unknown>): InterpretedRQLTag<StringMap> & Extra<StringMap> {
  const { nodes, table } = this,
    next = [] as Next<unknown>[],
    members = [] as (Raw<unknown> | SQLTag<unknown>)[];

  let extra = SQLTag.empty<unknown> ();

  const caseOfRef = (tag: RQLTag<unknown>, info: RefInfo, single: boolean) => {
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
      Variable: (value, as, cast) => {
        if (SQLTag.isSQLTag (value)) {
          if (as) {
            members.push (sql`
              (${value})${Raw (castAs (cast, as))} 
            `);
          } else {
            extra = extra.concat (value);
          }

        } else {
          throw new Error (`U can't insert "${value}" in this section of the RQLTag`);
        }
      },
      Literal: (value, as, cast) => {
        members.push (Raw (`${value}${castAs (cast, as)}`));
      },
      StringLiteral: (value, as, cast) => {
        members.push (Raw (`'${value}'${castAs (cast, as)}`));
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

  let tag = sql<unknown>`
    select distinct ${joinMembers (members)}
    from ${Raw (table)}
  `;

  return { next, tag, extra };
}

function compile(this: RQLTag<unknown>, params: unknown = {}) {
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

async function aggregate(this: RQLTag<unknown>, querier: Querier, params: StringMap = {}): Promise<any[]> {
  const [query, values, next] = this.compile (params);

  const rows = await querier<any> (query, values);

  if (!rows.length) return [];

  const nextData = await Promise.all (next.map (
    // { ...null } = {}
    n => n.tag.aggregate (querier, { ...params, refQLRows: rows })
  ));

  return rows.map (row =>
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

async function run(this: RQLTag<unknown>, querier: Querier, params?: unknown) {
  return this.aggregate (querier, params);
}

RQLTag.isRQLTag = function <Params> (value: any): value is RQLTag<Params> {
  return value != null && value[refqlType] === type;
};

export default RQLTag;