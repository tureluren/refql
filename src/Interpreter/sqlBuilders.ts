import { evolve, get, over, set } from "../Env/access";
import chain from "../more/chain";
import concat from "../more/concat";
import parameterize from "../more/parameterize";
import Table from "../Table";
import { Rec, Ref, Primitive, Values } from "../types";

export const byId = (table: Table, id?: string | number, op: "where" | "and" = "and") =>
  over ("query", q => {
    if (id != null) {
      return `${q} ${op} ${table.as}.id = ${id}`;
    }
    return q;
  });

export const castAs = (sql: Primitive | null, as?: string, cast?: string) =>
  `${sql}${cast ? `::${cast}` : ""}${as ? ` as ${as}` : ""}`;

export const fromTable = (table: Table) => chain (
  get ("comps"),
  comps => set ("query", `select ${comps.join (", ")} from ${table.schema ? `${table.schema}.` : ""}${table.name} ${table.as}`)
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
  refs.map (r => `${table.as}.${r.name} as ${r.as}`);

export const paginate = (limit?: number, offset?: number) =>
  over ("query", q => {
    if (limit != null) {
      q += ` limit ${limit}`;
    }
    if (offset != null) {
      q += ` offset ${offset}`;
    }
    return q;
  });

export const select = <Params>(comps: string | string[], rec: Rec<Params>) =>
  over ("comps", concat (comps), rec);

export const selectRefs = (table: Table, refs: Ref[]) => <Params>(rec: Rec<Params>) =>
  select (refsToComp (table, refs), rec);

export const whereIn = (lrefs: Ref[], rrefs: Ref[], rows: any[], table: Table) => chain (
  get ("values"),
  values => {
    const [query, newValues] = lrefs.reduce (([sql, vals], lr, idx) => {
      const uniqRows = [...new Set (rows.map (r => r[lr.as]))];
      const rr = rrefs[idx];
      const op = idx === 0 ? "" : "and ";

      return [
        `${sql} ${op}${table.as}.${rr.name} in (${parameterize (values.length, uniqRows.length)})`,
        vals.concat (uniqRows)
      ];
    }, ["where", [] as Values]);

    return evolve ({
      query: q => `${q} ${query}`,
      values: concat (newValues)
    });
  }
);