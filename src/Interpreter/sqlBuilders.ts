import { evolve, get, over, set } from "../Environment2/access";
import chain from "../more/chain";
import concat from "../more/concat";
import parameterize from "../more/parameterize";
import Table from "../Table";
import { Rec, Key, Primitive, Values } from "../types";

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

export const joinOn = (lkeys: Key[], rkeys: Key[], table: Table, xTable: Table) =>
  over ("query", query =>
    lkeys.reduce ((q, lk, idx) => {
      const rk = rkeys[idx];
      const op = idx === 0 ? "" : "and ";

      return `${q} ${op}${xTable.as}.${lk.name} = ${table.as}.${rk.name}`;

    }, `${query} join ${xTable.name} as ${xTable.as} on`)
  );

export const keysToComp = (table: Table, keys: Key[]) =>
  keys.map (k => `${table.as}.${k.name} as ${k.as}`);

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

export const selectRefs = (table: Table, keys: Key[]) => <Params>(rec: Rec<Params>) =>
  select (keysToComp (table, keys), rec);

export const whereIn = (lkeys: Key[], rkeys: Key[], rows: any[], table: Table) => chain (
  get ("values"),
  values => {
    const [query, newValues] = lkeys.reduce (([sql, vals], lk, idx) => {
      const uniqRows = [...new Set (rows.map (r => r[lk.as]))];
      const rk = rkeys[idx];
      const op = idx === 0 ? "" : "and ";

      return [
        `${sql} ${op}${table.as}.${rk.name} in (${parameterize (values.length, uniqRows.length)})`,
        vals.concat (uniqRows)
      ];
    }, ["where", [] as Values]);

    return evolve ({
      query: q => `${q} ${query}`,
      values: concat (newValues)
    });
  }
);