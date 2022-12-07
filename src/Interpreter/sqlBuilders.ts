import chain from "../common/chain";
import concat from "../common/concat";
import { Ref } from "../common/types";
import { evolve, get, over, set } from "../Env/access";
import Rec from "../Env/Rec";
// import In from "../In";
// import Select from "../Select";
import Table from "../Table";

export const castAs = (sql: boolean | null | number | string, as?: string, cast?: string) =>
  `${sql}${cast ? `::${cast}` : ""}${as ? ` ${as}` : ""}`;

export const fromTable = (table: Table, distinct: boolean = false) => chain (
  get ("comps"),
  comps => set ("strings", [() => `select${distinct ? " distinct" : ""}`, p => `${comps.map (f => f (p)).join (", ")}`, () => `from ${table}`])
);

export const joinOn = (lRefs: Ref[], rRefs: Ref[], table: Table, xTable: Table) =>
  over ("query", query =>
    lRefs.reduce ((q, lr, idx) => {
      const rk = rRefs[idx];
      const op = idx === 0 ? "" : "and ";

      return `${q} ${op}${xTable.name}.${lr.name} = ${table.name}.${rk.name}`;

    }, `${query} join ${xTable.name} on`)
  );

export const refsToComp = (table: Table, refs: Ref[]) =>
  refs.map (r => `${table.name}.${r.name} ${r.as}`);

export const select = (comps: (() => string) | (() => string[]), rec: Rec) =>
  over ("comps", concat (comps), rec);

export const selectRefs = (table: Table, refs: Ref[]) => (rec: Rec) =>
  select (() => refsToComp (table, refs), rec);

export const whereIn = (lRefs: Ref[], rRefs: Ref[], rows: any[], table: Table) => chain (
  get ("values"),
  values => {
    const [query, vals] = lRefs.reduce (([sql, vals], lr, idx) => {
      const uniqRows = [...new Set (rows.map (r => r[lr.as]))];
      const rr = rRefs[idx];
      const op = idx === 0 ? "" : "and ";
      // use Values ?
      const inStr = `in (${uniqRows.map ((_, idx) => `$${idx + vals.length + 1}`).join (", ")})`;

      return [
        `${sql} ${op}${table.name}.${rr.name} ${inStr}`,
        vals.concat (uniqRows)
      ];
    }, ["where", values]);

    return evolve ({
      query: q => `${q} ${query}`,
      values: concat (vals)
    });
  }
);