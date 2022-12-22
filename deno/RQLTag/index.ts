import castAs from "../common/castAs.ts";
import { flConcat, flMap, refqlType } from "../common/consts.ts";
import isEmptyTag from "../common/isEmptyTag.ts";
import joinMembers from "../common/joinMembers.ts";
import { Querier, RefInfo, RefQLRows, StringMap } from "../common/types.ts";
import unimplemented from "../common/unimplemented.ts";
import { all, ASTNode, Raw, Ref } from "../nodes/index.ts";
import { isRefNode } from "../nodes/RefNode.ts";
import SQLTag from "../SQLTag/index.ts";
import sql from "../SQLTag/sql.ts";
import Table from "../Table/index.ts";

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
    throw new Error ("U can't concat RQLTags that come from different tables");
  }

  return RQLTag (
    this.table,
    this.nodes.concat (other.nodes)
  );
}

function map(this: RQLTag<unknown>, f: (nodes: ASTNode<unknown>[]) => ASTNode<unknown>[]) {
  return RQLTag (this.table, f (this.nodes));
}

const unsupported = unimplemented ("RQLTag");

function interpret(this: RQLTag<unknown>): InterpretedRQLTag<StringMap> {
  const { nodes, table } = this,
    next = [] as Next<unknown>[],
    members = [] as (Raw<unknown> | SQLTag<unknown>)[];

  let sqlTag = SQLTag.empty<unknown> ();

  const caseOfRef = (single: boolean) => (tag: RQLTag<unknown>, info: RefInfo) => {
    members.push (Raw (`${info.lRef}`));
    next.push ({ tag, info, single });
  };

  const caseOfLiteral = (value: number | boolean | null, as?: string, cast?: string) => {
    members.push (Raw (`${value}${castAs (cast, as)}`));
  };

  for (const node of nodes) {
    node.caseOf<void> ({
      BelongsTo: caseOfRef (true),
      HasOne: caseOfRef (true),
      HasMany: caseOfRef (false),
      BelongsToMany: caseOfRef (false),
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
      Ref: (name, as) => {
        members.push (Raw (`${name} ${as}`));
      },
      Variable: (value, as, cast) => {
        if (SQLTag.isSQLTag (value)) {
          if (as) {
            members.push (sql`
              (${value})${Raw (castAs (cast, as))} 
            `);
          } else {
            sqlTag = sqlTag.concat (value);
          }

        } else {
          throw new Error (`U can't insert "${value}" in this section of the RQLTag`);
        }
      },
      NumericLiteral: caseOfLiteral,
      BooleanLiteral: caseOfLiteral,
      NullLiteral: caseOfLiteral,
      StringLiteral: (value, as, cast) => {
        members.push (Raw (`'${value}'${castAs (cast, as)}`));
      },
      Raw: unsupported ("Raw"),
      Value: unsupported ("Value"),
      Values: unsupported ("Values"),
      Values2D: unsupported ("Values2D")
    });
  }

  const refMemberLength = nodes.reduce ((n, node) =>
    isRefNode (node) || Ref.isRef (node) ? n + 1 : n
  , 0);

  if (refMemberLength === members.length) {
    members.push (Raw (`${table.name}.${all.sign}`));
  }

  let tag = sql<unknown>`
    select ${joinMembers (members)}
    from ${Raw (`${table}`)}
  `;

  if (!isEmptyTag (sqlTag)) {
    tag = tag.concat (sqlTag);
  }

  return { next, tag };
}

function compile(this: RQLTag<unknown>, params: unknown = {}) {
  if (!this.interpreted) {
    this.interpreted = this.interpret ();
  }
  const { tag, next } = this.interpreted;

  return [...tag.compile (params, this.table), next];
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
  );
}

async function run(this: RQLTag<unknown>, querier: Querier, params?: unknown) {
  return this.aggregate (querier, params);
}

RQLTag.isRQLTag = function <Params> (value: any): value is RQLTag<Params> {
  return value != null && value[refqlType] === type;
};

export default RQLTag;