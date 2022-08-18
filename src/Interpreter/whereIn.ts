import evolve from "../Environment2/evolve";
import get from "../Environment2/get";
import chain from "../more/chain";
import concat from "../more/concat";
import parameterize from "../more/parameterize";
import Table from "../Table";
import { Key, Values } from "../types";

const whereIn = (lkeys: Key[], rkeys: Key[], rows: any[], table: Table) => chain (
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

export default whereIn;