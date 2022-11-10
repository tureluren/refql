import chain from "../common/chain";
import concat from "../common/concat";
import { Ref } from "../common/types";
import { evolve, get, over, set } from "../Env/access";
import Rec from "../Env/Rec";
import In from "../In";
import Select from "../Select";
import Table from "../Table";

export const byId = (table: Table, id?: string | number, op: "where" | "and" = "and") => chain (
  get ("values"),
  values => {
    if (id == null) return r => r;

    return evolve ({
      query: q => `${q} ${op} ${table.as}.id = $${values.length + 1}`,
      values: concat (id)
    });
  });

export const castAs = (sql: boolean | null | number | string, as?: string, cast?: string) =>
  `${sql}${cast ? `::${cast}` : ""}${as ? ` as ${as}` : ""}`;

export const fromTable = (table: Table, distinct: boolean = false) => chain (
  get ("comps"),
  comps => set ("query", Select (table, comps).compile (false, distinct)[0])
);

export const joinOn = (lrefs: Ref[], rrefs: Ref[], table: Table, xTable: Table) =>
  over ("query", query =>
    lrefs.reduce ((q, lr, idx) => {
      const rk = rrefs[idx];
      const op = idx === 0 ? "" : "and ";

      return `${q} ${op}${xTable.as}.${lr.name} = ${table.as}.${rk.name}`;

    }, `${query} join ${xTable.name} as ${xTable.as} on`)
  );

export const refsToComp = (table: Table, refs: Ref[]) =>
  refs.map (r => `${r.name} as ${r.as}`);

export const paginate = (limit?: number, offset?: number) => chain (
  get ("values"),
  values => {
    if (limit == null && offset == null) return r => r;

    let query = ``, vals = [];

    if (limit != null) {
      query += ` limit $${values.length + 1}`;
      vals.push (limit);
    }

    if (offset != null) {
      query += ` offset $${values.length + vals.length + 1}`;
      vals.push (offset);
    }

    return evolve ({
      query: q => `${q}${query}`,
      values: concat (vals)
    });
  }
);

export const select = (comps: string | string[], rec: Rec) =>
  over ("comps", concat (comps), rec);

export const selectRefs = (table: Table, refs: Ref[]) => (rec: Rec) =>
  select (refsToComp (table, refs), rec);

export const whereIn = (lrefs: Ref[], rrefs: Ref[], rows: any[], table: Table) => chain (
  get ("values"),
  values => {
    const [query, vals] = lrefs.reduce (([sql, vals], lr, idx) => {
      const uniqRows = [...new Set (rows.map (r => r[lr.as]))];
      const rr = rrefs[idx];
      const op = idx === 0 ? "" : "and ";
      const [inStr] = In (uniqRows).compile (vals.length);

      return [
        `${sql} ${op}${table.as}.${rr.name} ${inStr}`,
        vals.concat (uniqRows)
      ];
    }, ["where", values]);

    return evolve ({
      query: q => `${q} ${query}`,
      values: concat (vals)
    });
  }
);